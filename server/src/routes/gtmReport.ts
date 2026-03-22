import { Router, Request, Response } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

// ── Category mapping ───────────────────────────────────────────────────────────
const TOOL_CATEGORY: Record<string, string> = {
  clay: "aggregation",       apollo: "aggregation",      zoominfo: "aggregation",
  pdl: "enrichment",        clearbit: "enrichment",     clearbit_p: "enrichment",
  hunter: "enrichment",     lusha: "enrichment",        cognism: "enrichment",
  snovio: "enrichment",     rocketreach: "enrichment",
  heyreach: "activation",   instantly: "activation",    lemlist: "activation",
  smartlead: "activation",  replyio: "activation",      phantombuster: "activation",
  outreach: "activation",
  hubspot: "crm",           salesforce: "crm",          pipedrive: "crm",
  airtable: "crm",          attio: "crm",
  stripe: "billing",        chargebee: "billing",       paddle: "billing",
  lemonsqueezy: "billing",
  n8n: "infrastructure",    make: "infrastructure",
};

const TOOL_LABELS: Record<string, string> = {
  clay: "Clay",             apollo: "Apollo",           heyreach: "HeyReach",
  lemlist: "Lemlist",       instantly: "Instantly",     smartlead: "Smartlead",
  phantombuster: "PhantomBuster", replyio: "Reply.io", outreach: "Outreach",
  clearbit: "Clearbit",    clearbit_p: "Clearbit Prospector", zoominfo: "ZoomInfo",
  pdl: "People Data Labs", hunter: "Hunter.io",        lusha: "Lusha",
  cognism: "Cognism",      snovio: "Snov.io",          rocketreach: "RocketReach",
  hubspot: "HubSpot",      pipedrive: "Pipedrive",     salesforce: "Salesforce",
  airtable: "Airtable",    attio: "Attio",             stripe: "Stripe",
  chargebee: "Chargebee",  paddle: "Paddle",           lemonsqueezy: "LemonSqueezy",
  n8n: "n8n",              make: "Make.com",
};

// ── Signal tier mapping ────────────────────────────────────────────────────────
const EVENT_TIER: Record<string, number> = {
  reply_received: 1,    meeting_booked: 1,    deal_won: 1,
  deal_created: 1,      email_clicked: 1,     link_clicked: 1,
  connection_accepted: 1,
  lead_enriched: 2,     email_opened: 2,      connection_sent: 2,
  connection_request_sent: 2,
  lead_imported: 3,     sequence_started: 3,  email_sent: 3,
  message_sent: 3,
};

const PERIOD_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "all": 9999 };
const PERIOD_LABELS: Record<string, string> = { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days", "all": "All time" };

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/gtm-report?workspaceId=&period=30d
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const workspaceId = req.query.workspaceId as string;
  const period      = (req.query.period as string) ?? "30d";
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });

  const days  = PERIOD_DAYS[period] ?? 30;
  const since = days < 9999 ? new Date(Date.now() - days * 86400000) : new Date(0);

  try {
    // ── Workspace ────────────────────────────────────────────────────────────
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });

    // ── Stack ────────────────────────────────────────────────────────────────
    const connections = await prisma.integrationConnection.findMany({
      where: { workspaceId, status: "connected" },
      select: { provider: true },
    });

    const stackByCategory: Record<string, { tool: string; label: string }[]> = {
      aggregation: [], enrichment: [], activation: [],
      crm: [], billing: [], infrastructure: [],
    };
    for (const c of connections) {
      const cat = TOOL_CATEGORY[c.provider] ?? "infrastructure";
      if (!stackByCategory[cat]) stackByCategory[cat] = [];
      stackByCategory[cat].push({ tool: c.provider, label: TOOL_LABELS[c.provider] ?? c.provider });
    }

    // ── Pipeline unique lead counts ──────────────────────────────────────────
    const [sourced, enriched, contacted, replied, meetings, dealsWon] = await Promise.all([
      prisma.touchpoint.findMany({
        where: { workspaceId, eventType: { in: ["lead_imported", "lead_enriched"] }, recordedAt: { gte: since } },
        select: { iqLeadId: true }, distinct: ["iqLeadId"],
      }).then((r) => r.length),
      prisma.touchpoint.findMany({
        where: { workspaceId, eventType: "lead_enriched", recordedAt: { gte: since } },
        select: { iqLeadId: true }, distinct: ["iqLeadId"],
      }).then((r) => r.length),
      prisma.touchpoint.findMany({
        where: { workspaceId, eventType: { in: ["sequence_started", "email_sent", "message_sent", "connection_sent", "connection_request_sent"] }, recordedAt: { gte: since } },
        select: { iqLeadId: true }, distinct: ["iqLeadId"],
      }).then((r) => r.length),
      prisma.touchpoint.findMany({
        where: { workspaceId, eventType: "reply_received", recordedAt: { gte: since } },
        select: { iqLeadId: true }, distinct: ["iqLeadId"],
      }).then((r) => r.length),
      prisma.touchpoint.count({ where: { workspaceId, eventType: "meeting_booked", recordedAt: { gte: since } } }),
      prisma.touchpoint.count({ where: { workspaceId, eventType: "deal_won", recordedAt: { gte: since } } }),
    ]);

    // ── Email/outreach metrics ───────────────────────────────────────────────
    const [emailsSent, emailsOpened, unsubscribed, emailBounced] = await Promise.all([
      prisma.touchpoint.count({ where: { workspaceId, eventType: "email_sent", recordedAt: { gte: since } } }),
      prisma.touchpoint.count({ where: { workspaceId, eventType: "email_opened", recordedAt: { gte: since } } }),
      prisma.touchpoint.count({ where: { workspaceId, eventType: "unsubscribed", recordedAt: { gte: since } } }),
      prisma.touchpoint.count({ where: { workspaceId, eventType: "email_bounced", recordedAt: { gte: since } } }),
    ]);

    const openRate   = emailsSent > 0 ? +((emailsOpened / emailsSent) * 100).toFixed(1) : null;
    const replyRate  = emailsSent > 0 ? +((replied / emailsSent) * 100).toFixed(1) : null;
    const unsubRate  = emailsSent > 0 ? +((unsubscribed / emailsSent) * 100).toFixed(2) : null;
    const bounceRate = emailsSent > 0 ? +((emailBounced / emailsSent) * 100).toFixed(2) : null;
    const meetingRate = replied > 0   ? +((meetings / replied) * 100).toFixed(1) : null;

    // ── Pipeline value ───────────────────────────────────────────────────────
    const outcomes = await prisma.outcome.findMany({
      where: { workspaceId, type: "deal_won", recordedAt: { gte: since } },
      select: { value: true, currency: true },
    });
    const totalPipelineValue = outcomes.reduce((s, o) => s + (o.value ?? 0), 0);

    // ── Signal event breakdown ───────────────────────────────────────────────
    const eventCounts = await prisma.touchpoint.groupBy({
      by: ["eventType"],
      where: { workspaceId, recordedAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
    const signals = eventCounts.map((e) => ({
      event: e.eventType,
      count: e._count.id,
      tier: EVENT_TIER[e.eventType] ?? 4,
    }));

    return res.json({
      workspace: { name: workspace?.name ?? "Workspace" },
      period: PERIOD_LABELS[period] ?? period,
      stack: stackByCategory,
      pipeline: { sourced, enriched, contacted, replied, meetings, dealsWon },
      metrics: { openRate, replyRate, unsubRate, bounceRate, meetingRate, emailsSent, totalPipelineValue },
      signals,
    });
  } catch (err) {
    console.error("[gtm-report]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
