/**
 * attribution.ts
 *
 * Tool & stack attribution analytics.
 *
 * GET /api/attribution/tools?workspaceId=&days=30
 *   → per-tool stats: leads_touched, replies, meetings, deals_won, revenue
 *
 * GET /api/attribution/stacks?workspaceId=&experimentId=&days=30
 *   → per-stack (A/B) attribution stats
 *
 * GET /api/attribution/lead/:iqLeadId?workspaceId=
 *   → full journey for one lead: touchpoints + outcomes
 */

import { Router, Request, Response } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// ── GET /api/attribution/tools ────────────────────────────────────────────────

router.get("/tools", async (req: Request, res: Response) => {
  const workspaceId = String(req.query.workspaceId || "");
  const days        = Math.min(parseInt(String(req.query.days || "30"), 10), 365);
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });

  const since = new Date(Date.now() - days * 864e5);

  try {
    // All touchpoints in window
    const touchpoints = await prisma.touchpoint.findMany({
      where: { workspaceId, recordedAt: { gte: since } },
      select: { tool: true, channel: true, eventType: true, iqLeadId: true },
    });

    // All outcomes in window
    const outcomes = await prisma.outcome.findMany({
      where: { workspaceId, recordedAt: { gte: since } },
      select: {
        type: true, value: true, currency: true,
        attributedTools: true, reportingTool: true,
        firstTouchTool: true, lastTouchTool: true,
      },
    });

    // Build per-tool stats
    const stats: Record<string, {
      tool: string; channel: string;
      leadsTouched: Set<string>;
      replies: number; meetings: number;
      dealsCreated: number; dealsWon: number;
      revenue: number; currency: string;
      firstTouchWins: number; lastTouchWins: number;
    }> = {};

    const ensure = (tool: string, channel: string) => {
      if (!stats[tool]) {
        stats[tool] = {
          tool, channel,
          leadsTouched: new Set(),
          replies: 0, meetings: 0,
          dealsCreated: 0, dealsWon: 0,
          revenue: 0, currency: "EUR",
          firstTouchWins: 0, lastTouchWins: 0,
        };
      }
    };

    for (const tp of touchpoints) {
      ensure(tp.tool, tp.channel);
      stats[tp.tool].leadsTouched.add(tp.iqLeadId);
      if (tp.eventType === "reply_received")   stats[tp.tool].replies++;
      if (tp.eventType === "meeting_booked")   stats[tp.tool].meetings++;
      if (tp.eventType === "deal_created")     stats[tp.tool].dealsCreated++;
      if (tp.eventType === "deal_won")         stats[tp.tool].dealsWon++;
    }

    for (const outcome of outcomes) {
      const attributed: string[] = JSON.parse(outcome.attributedTools || "[]");
      for (const tool of attributed) {
        if (!stats[tool]) continue;
        if (outcome.type === "deal_won") {
          stats[tool].dealsWon++;
          stats[tool].revenue += outcome.value || 0;
          if (outcome.currency) stats[tool].currency = outcome.currency;
        }
        if (outcome.type === "meeting_booked") stats[tool].meetings++;
        if (outcome.type === "reply_received")  stats[tool].replies++;
      }
      if (outcome.firstTouchTool && stats[outcome.firstTouchTool]) stats[outcome.firstTouchTool].firstTouchWins++;
      if (outcome.lastTouchTool  && stats[outcome.lastTouchTool])  stats[outcome.lastTouchTool].lastTouchWins++;
    }

    const result = Object.values(stats).map(s => ({
      tool: s.tool,
      channel: s.channel,
      leadsTouched: s.leadsTouched.size,
      replies: s.replies,
      meetings: s.meetings,
      dealsCreated: s.dealsCreated,
      dealsWon: s.dealsWon,
      revenue: Math.round(s.revenue * 100) / 100,
      currency: s.currency,
      firstTouchWins: s.firstTouchWins,
      lastTouchWins: s.lastTouchWins,
      replyRate:   s.leadsTouched.size ? Math.round((s.replies   / s.leadsTouched.size) * 1000) / 10 : 0,
      meetingRate: s.leadsTouched.size ? Math.round((s.meetings  / s.leadsTouched.size) * 1000) / 10 : 0,
      dealWinRate: s.leadsTouched.size ? Math.round((s.dealsWon  / s.leadsTouched.size) * 1000) / 10 : 0,
    })).sort((a, b) => b.revenue - a.revenue || b.meetings - a.meetings);

    return res.json({ days, since: since.toISOString(), tools: result });
  } catch (err: any) {
    console.error("[attribution/tools]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/attribution/stacks ───────────────────────────────────────────────

router.get("/stacks", async (req: Request, res: Response) => {
  const workspaceId  = String(req.query.workspaceId || "");
  const experimentId = String(req.query.experimentId || "");
  const days         = Math.min(parseInt(String(req.query.days || "30"), 10), 365);
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });

  const since = new Date(Date.now() - days * 864e5);

  try {
    const outcomeWhere: any = {
      workspaceId,
      recordedAt: { gte: since },
      stackVariant: { not: null },
    };
    if (experimentId) outcomeWhere.experimentId = experimentId;

    const outcomes = await prisma.outcome.findMany({
      where: outcomeWhere,
      select: {
        type: true, value: true, currency: true,
        stackVariant: true, experimentId: true,
        attributedTools: true,
      },
    });

    const stacks: Record<string, {
      variant: string;
      replies: number; meetings: number;
      dealsWon: number; revenue: number; currency: string;
      leadIds: Set<string>;
    }> = {
      A: { variant: "A", replies: 0, meetings: 0, dealsWon: 0, revenue: 0, currency: "EUR", leadIds: new Set() },
      B: { variant: "B", replies: 0, meetings: 0, dealsWon: 0, revenue: 0, currency: "EUR", leadIds: new Set() },
    };

    for (const o of outcomes) {
      const s = stacks[o.stackVariant!];
      if (!s) continue;
      if (o.type === "reply_received")  s.replies++;
      if (o.type === "meeting_booked")  s.meetings++;
      if (o.type === "deal_won") {
        s.dealsWon++;
        s.revenue += o.value || 0;
        if (o.currency) s.currency = o.currency;
      }
    }

    // Touchpoints for lead count per stack
    const tpWhere: any = { workspaceId, recordedAt: { gte: since }, stackVariant: { not: null } };
    if (experimentId) tpWhere.experimentId = experimentId;
    const touchpoints = await prisma.touchpoint.findMany({
      where: tpWhere,
      select: { stackVariant: true, iqLeadId: true },
    });
    for (const tp of touchpoints) {
      if (tp.stackVariant && stacks[tp.stackVariant]) {
        stacks[tp.stackVariant].leadIds.add(tp.iqLeadId);
      }
    }

    const result = Object.values(stacks).map(s => ({
      variant: s.variant,
      leadsTouched: s.leadIds.size,
      replies: s.replies,
      meetings: s.meetings,
      dealsWon: s.dealsWon,
      revenue: Math.round(s.revenue * 100) / 100,
      currency: s.currency,
      replyRate:   s.leadIds.size ? Math.round((s.replies  / s.leadIds.size) * 1000) / 10 : 0,
      meetingRate: s.leadIds.size ? Math.round((s.meetings / s.leadIds.size) * 1000) / 10 : 0,
      dealWinRate: s.leadIds.size ? Math.round((s.dealsWon / s.leadIds.size) * 1000) / 10 : 0,
    }));

    return res.json({ days, experimentId: experimentId || null, stacks: result });
  } catch (err: any) {
    console.error("[attribution/stacks]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/attribution/lead/:iqLeadId ───────────────────────────────────────

router.get("/lead/:iqLeadId", async (req: Request, res: Response) => {
  const { iqLeadId } = req.params;
  const workspaceId  = String(req.query.workspaceId || "");
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });

  try {
    const lead = await prisma.iqLead.findFirst({ where: { id: iqLeadId, workspaceId } });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const [touchpoints, outcomes] = await Promise.all([
      prisma.touchpoint.findMany({
        where: { workspaceId, iqLeadId },
        orderBy: { recordedAt: "asc" },
      }),
      prisma.outcome.findMany({
        where: { workspaceId, iqLeadId },
        orderBy: { recordedAt: "asc" },
      }),
    ]);

    return res.json({
      id: lead.id,
      displayName: lead.displayName,
      company: lead.company,
      title: lead.title,
      firstSeenAt: lead.firstSeenAt,
      lastSeenAt: lead.lastSeenAt,
      // PII presence flags only — never return hashes or encrypted values
      hasEmail:    !!lead.emailHash,
      hasLinkedin: !!lead.linkedinHash,
      hasPhone:    !!lead.phoneHash,
      touchpoints: touchpoints.map(t => ({
        id: t.id, tool: t.tool, channel: t.channel,
        eventType: t.eventType, recordedAt: t.recordedAt,
        experimentId: t.experimentId, stackVariant: t.stackVariant,
        meta: t.meta ? JSON.parse(t.meta) : null,
      })),
      outcomes: outcomes.map(o => ({
        id: o.id, type: o.type, value: o.value, currency: o.currency,
        reportingTool: o.reportingTool,
        firstTouchTool: o.firstTouchTool, lastTouchTool: o.lastTouchTool,
        attributedTools: JSON.parse(o.attributedTools || "[]"),
        attributedChannels: JSON.parse(o.attributedChannels || "[]"),
        stackVariant: o.stackVariant, experimentId: o.experimentId,
        recordedAt: o.recordedAt,
      })),
    });
  } catch (err: any) {
    console.error("[attribution/lead]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
