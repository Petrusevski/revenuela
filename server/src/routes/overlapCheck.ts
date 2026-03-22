/**
 * overlapCheck.ts
 *
 * GET /api/overlap-check
 *
 * Tells you whether a contact is currently active in any outreach sequence
 * across all connected tools. Designed to be called from n8n / Make.com
 * BEFORE enrolling a contact so you can skip them if they're already
 * being touched elsewhere.
 *
 * Auth:
 *   Bearer <jwt>   — Authorization header (preferred)
 *   ?token=<jwt>   — query param (for tools that can't set headers)
 *
 * Query params:
 *   workspaceId   required
 *   email         required   the contact's email address
 *
 * Response:
 *   {
 *     active: boolean,
 *     contact: { id, displayName, company } | null,
 *     sequences: [{ tool, toolLabel, channel, sinceHours, lastEvent }],
 *     checkedAt: ISO string,
 *   }
 *
 * A "sequence" is active when the tool has fired a start-type event
 * (sequence_started, connection_sent, email_sent, message_sent) with no
 * terminal event (reply_received, meeting_booked, sequence_ended,
 * deal_won, deal_lost, unsubscribed) following it.
 */

import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { hashEmail } from "../utils/identity";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

const TOOL_LABELS: Record<string, string> = {
  clay: "Clay", apollo: "Apollo", heyreach: "HeyReach", lemlist: "Lemlist",
  instantly: "Instantly", smartlead: "Smartlead", phantombuster: "PhantomBuster",
  replyio: "Reply.io", outreach: "Outreach", clearbit: "Clearbit",
  zoominfo: "ZoomInfo", pdl: "People Data Labs", hunter: "Hunter.io",
  lusha: "Lusha", cognism: "Cognism", snovio: "Snov.io", rocketreach: "RocketReach",
  hubspot: "HubSpot", pipedrive: "Pipedrive", salesforce: "Salesforce",
  airtable: "Airtable", attio: "Attio", stripe: "Stripe",
  chargebee: "Chargebee", paddle: "Paddle", lemonsqueezy: "LemonSqueezy",
  n8n: "n8n", make: "Make.com",
};

const TOOL_CHANNEL: Record<string, string> = {
  heyreach: "linkedin", expandi: "linkedin", dripify: "linkedin", waalaxy: "linkedin",
  lemlist: "email", instantly: "email", smartlead: "email", mailshake: "email",
  apollo: "email", replyio: "email", outreach: "email",
  hubspot: "crm", pipedrive: "crm", salesforce: "crm",
  n8n: "automation", make: "automation",
};

const START_EVENTS = new Set([
  "sequence_started", "connection_sent", "email_sent",
  "message_sent", "connection_request_sent",
]);

const TERMINAL_EVENTS = new Set([
  "reply_received", "meeting_booked", "sequence_ended",
  "deal_won", "deal_lost", "unsubscribed",
]);

// ── Auth helper: Bearer header OR ?token= query param ────────────────────────

function authenticate(req: Request): boolean {
  const authHeader = req.headers.authorization;
  const tokenParam = req.query.token as string | undefined;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : tokenParam;

  if (!token) return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/overlap-check
// ─────────────────────────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response) => {
  if (!authenticate(req)) {
    return res.status(401).json({
      error: "Unauthorized. Pass Bearer token in Authorization header or ?token= param.",
    });
  }

  const workspaceId = req.query.workspaceId as string;
  const email       = req.query.email       as string;

  if (!workspaceId || !email) {
    return res.status(400).json({ error: "workspaceId and email are required." });
  }

  try {
    const emailHash = hashEmail(email);
    const lead = await prisma.iqLead.findFirst({
      where: { workspaceId, emailHash },
    });

    if (!lead) {
      return res.json({
        active:     false,
        contact:    null,
        sequences:  [],
        checkedAt:  new Date().toISOString(),
      });
    }

    // Get all touchpoints for this lead, newest first
    const touchpoints = await prisma.touchpoint.findMany({
      where: { workspaceId, iqLeadId: lead.id },
      orderBy: { recordedAt: "desc" },
    });

    // Per-tool: determine if active
    const toolMap = new Map<string, { started: boolean; terminal: boolean; lastStart: Date | null }>();

    for (const tp of touchpoints) {
      const tool = tp.tool;
      if (!toolMap.has(tool)) {
        toolMap.set(tool, { started: false, terminal: false, lastStart: null });
      }
      const entry = toolMap.get(tool)!;
      if (START_EVENTS.has(tp.eventType) && !entry.started) {
        entry.started   = true;
        entry.lastStart = tp.recordedAt;
      }
      if (TERMINAL_EVENTS.has(tp.eventType)) {
        entry.terminal = true;
      }
    }

    const now = Date.now();
    const activeSequences = Array.from(toolMap.entries())
      .filter(([, v]) => v.started && !v.terminal)
      .map(([tool, v]) => ({
        tool,
        toolLabel:  TOOL_LABELS[tool] ?? tool,
        channel:    TOOL_CHANNEL[tool] ?? "unknown",
        sinceHours: v.lastStart
          ? Math.round(((now - v.lastStart.getTime()) / 3_600_000) * 10) / 10
          : null,
        lastEvent: touchpoints.find((t) => t.tool === tool)?.eventType ?? null,
      }));

    res.json({
      active:    activeSequences.length > 0,
      contact: {
        id:          lead.id,
        displayName: lead.displayName,
        company:     lead.company ?? null,
      },
      sequences:  activeSequences,
      checkedAt:  new Date().toISOString(),
    });
  } catch (err) {
    console.error("[overlap-check]", err);
    res.status(500).json({ error: "Failed to check overlap." });
  }
});

export default router;
