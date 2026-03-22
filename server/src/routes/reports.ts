import { Router, Request, Response } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { generateGTMReportPDF, GTMReportData } from "../services/pdfReport";
import { generateGTMReportXLSX } from "../services/xlsxReport";

const router = Router();

const PERIOD_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "all": 9999 };

const TOOL_CATEGORY: Record<string, string> = {
  clay: "aggregation",     apollo: "aggregation",      zoominfo: "aggregation",
  pdl: "enrichment",       clearbit: "enrichment",     clearbit_p: "enrichment",
  hunter: "enrichment",    lusha: "enrichment",        cognism: "enrichment",
  snovio: "enrichment",    rocketreach: "enrichment",
  heyreach: "activation",  instantly: "activation",    lemlist: "activation",
  smartlead: "activation", replyio: "activation",      phantombuster: "activation", outreach: "activation",
  hubspot: "crm",          salesforce: "crm",          pipedrive: "crm",  airtable: "crm", attio: "crm",
  stripe: "billing",       chargebee: "billing",       paddle: "billing", lemonsqueezy: "billing",
  n8n: "infrastructure",   make: "infrastructure",
};
const TOOL_LABELS: Record<string, string> = {
  clay: "Clay", apollo: "Apollo", heyreach: "HeyReach", lemlist: "Lemlist",
  instantly: "Instantly", smartlead: "Smartlead", phantombuster: "PhantomBuster",
  replyio: "Reply.io", outreach: "Outreach", clearbit: "Clearbit",
  clearbit_p: "Clearbit Prospector", zoominfo: "ZoomInfo", pdl: "People Data Labs",
  hunter: "Hunter.io", lusha: "Lusha", cognism: "Cognism", snovio: "Snov.io",
  rocketreach: "RocketReach", hubspot: "HubSpot", pipedrive: "Pipedrive",
  salesforce: "Salesforce", airtable: "Airtable", attio: "Attio",
  stripe: "Stripe", chargebee: "Chargebee", paddle: "Paddle", lemonsqueezy: "LemonSqueezy",
  n8n: "n8n", make: "Make.com",
};
const TOOL_CHANNEL: Record<string, string> = {
  clay: "prospecting", apollo: "email", heyreach: "linkedin", lemlist: "email",
  instantly: "email", smartlead: "email", phantombuster: "linkedin", replyio: "email",
  outreach: "email", clearbit: "enrichment", clearbit_p: "enrichment", zoominfo: "enrichment",
  pdl: "enrichment", hunter: "enrichment", lusha: "enrichment", cognism: "enrichment",
  snovio: "enrichment", rocketreach: "enrichment", hubspot: "crm", pipedrive: "crm",
  salesforce: "crm", airtable: "crm", attio: "crm", stripe: "billing",
  chargebee: "billing", paddle: "billing", lemonsqueezy: "billing", n8n: "automation", make: "automation",
};
const SILENCE_THRESHOLD: Record<string, number> = {
  clay: 4, apollo: 6, heyreach: 6, lemlist: 6, instantly: 6, smartlead: 6,
  hubspot: 48, salesforce: 48, stripe: 48, n8n: 12, make: 12,
};
const EVENT_TIER: Record<string, number> = {
  reply_received: 1, meeting_booked: 1, deal_won: 1, deal_created: 1, email_clicked: 1, link_clicked: 1, connection_accepted: 1,
  lead_enriched: 2, email_opened: 2, connection_sent: 2, connection_request_sent: 2,
  lead_imported: 3, sequence_started: 3, email_sent: 3, message_sent: 3,
};

// ── Assemble full report data ─────────────────────────────────────────────────
async function collectReportData(workspaceId: string, period: string): Promise<GTMReportData> {
  const days = PERIOD_DAYS[period] ?? 30;
  const since = days < 9999 ? new Date(Date.now() - days * 86400000) : new Date(0);
  const now   = new Date();
  const h24   = new Date(now.getTime() - 86400000);
  const d7    = new Date(now.getTime() - 7 * 86400000);

  const [workspace, connections, sourced, enriched, contacted, replied, meetings, dealsWon,
    emailsSent, emailsOpened, unsubscribed, emailBounced, eventCounts, outcomes,
    counts24h, counts7d, lastEvents] = await Promise.all([

    prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true, primaryDomain: true } }),

    prisma.integrationConnection.findMany({
      where: { workspaceId, status: "connected" }, select: { provider: true },
    }),

    prisma.touchpoint.findMany({ where: { workspaceId, eventType: { in: ["lead_imported", "lead_enriched"] }, recordedAt: { gte: since } }, select: { iqLeadId: true }, distinct: ["iqLeadId"] }).then((r) => r.length),
    prisma.touchpoint.findMany({ where: { workspaceId, eventType: "lead_enriched", recordedAt: { gte: since } }, select: { iqLeadId: true }, distinct: ["iqLeadId"] }).then((r) => r.length),
    prisma.touchpoint.findMany({ where: { workspaceId, eventType: { in: ["sequence_started","email_sent","message_sent","connection_sent","connection_request_sent"] }, recordedAt: { gte: since } }, select: { iqLeadId: true }, distinct: ["iqLeadId"] }).then((r) => r.length),
    prisma.touchpoint.findMany({ where: { workspaceId, eventType: "reply_received", recordedAt: { gte: since } }, select: { iqLeadId: true }, distinct: ["iqLeadId"] }).then((r) => r.length),
    prisma.touchpoint.count({ where: { workspaceId, eventType: "meeting_booked", recordedAt: { gte: since } } }),
    prisma.touchpoint.count({ where: { workspaceId, eventType: "deal_won", recordedAt: { gte: since } } }),

    prisma.touchpoint.count({ where: { workspaceId, eventType: "email_sent", recordedAt: { gte: since } } }),
    prisma.touchpoint.count({ where: { workspaceId, eventType: "email_opened", recordedAt: { gte: since } } }),
    prisma.touchpoint.count({ where: { workspaceId, eventType: "unsubscribed", recordedAt: { gte: since } } }),
    prisma.touchpoint.count({ where: { workspaceId, eventType: "email_bounced", recordedAt: { gte: since } } }),

    prisma.touchpoint.groupBy({ by: ["eventType"], where: { workspaceId, recordedAt: { gte: since } }, _count: { id: true }, orderBy: { _count: { id: "desc" } } }),

    prisma.outcome.findMany({ where: { workspaceId, type: "deal_won", recordedAt: { gte: since } }, select: { value: true } }),

    prisma.touchpoint.groupBy({ by: ["tool"], where: { workspaceId, recordedAt: { gte: h24 } }, _count: { id: true } }),
    prisma.touchpoint.groupBy({ by: ["tool"], where: { workspaceId, recordedAt: { gte: d7 }  }, _count: { id: true } }),
    prisma.touchpoint.findMany({ where: { workspaceId }, orderBy: { recordedAt: "desc" }, distinct: ["tool"], select: { tool: true, recordedAt: true } }),
  ]);

  // Stack
  const stackByCategory: Record<string, { tool: string; label: string }[]> = {
    aggregation: [], enrichment: [], activation: [], crm: [], billing: [], infrastructure: [],
  };
  for (const c of connections) {
    const cat = TOOL_CATEGORY[c.provider] ?? "infrastructure";
    if (!stackByCategory[cat]) stackByCategory[cat] = [];
    stackByCategory[cat].push({ tool: c.provider, label: TOOL_LABELS[c.provider] ?? c.provider });
  }

  // Tool health
  const connectedSet = new Set(connections.map((c) => c.provider));
  const map24h  = Object.fromEntries(counts24h.map((r) => [r.tool, r._count.id]));
  const map7d   = Object.fromEntries(counts7d.map((r) => [r.tool, r._count.id]));
  const mapLast = Object.fromEntries(lastEvents.map((r) => [r.tool, r.recordedAt]));

  const tools = [...connectedSet].map((tool) => {
    const last = mapLast[tool] ?? null;
    const hoursSince = last ? Math.floor((now.getTime() - new Date(last).getTime()) / 3600000) : null;
    const threshold  = SILENCE_THRESHOLD[tool] ?? 24;
    let status: string = "never";
    if (hoursSince !== null) {
      if (hoursSince <= threshold * 0.5) status = "healthy";
      else if (hoursSince <= threshold)  status = "warning";
      else                               status = "silent";
    }
    return { tool, label: TOOL_LABELS[tool] ?? tool, channel: TOOL_CHANNEL[tool] ?? "other", status, events24h: map24h[tool] ?? 0, events7d: map7d[tool] ?? 0, lastEventAt: last ? last.toISOString() : null };
  });

  // Metrics
  const openRate    = emailsSent > 0 ? +((emailsOpened / emailsSent) * 100).toFixed(1) : null;
  const replyRate   = emailsSent > 0 ? +((replied / emailsSent) * 100).toFixed(1) : null;
  const unsubRate   = emailsSent > 0 ? +((unsubscribed / emailsSent) * 100).toFixed(2) : null;
  const bounceRate  = emailsSent > 0 ? +((emailBounced / emailsSent) * 100).toFixed(2) : null;
  const meetingRate = replied > 0     ? +((meetings / replied) * 100).toFixed(1) : null;
  const totalPipelineValue = outcomes.reduce((s, o) => s + (o.value ?? 0), 0);

  return {
    workspace: { name: workspace?.name ?? "Workspace", domain: workspace?.primaryDomain ?? undefined },
    period: { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days", "all": "All time" }[period] ?? period,
    stack: stackByCategory,
    pipeline: { sourced, enriched, contacted, replied, meetings, dealsWon },
    metrics: { openRate, replyRate, unsubRate, bounceRate, meetingRate, emailsSent, totalPipelineValue },
    signals: eventCounts.map((e) => ({ event: e.eventType, count: e._count.id, tier: EVENT_TIER[e.eventType] ?? 4 })),
    tools,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/export?workspaceId=&format=pdf|xlsx&period=30d
// ─────────────────────────────────────────────────────────────────────────────
router.get("/export", requireAuth, async (req: Request, res: Response) => {
  const workspaceId = req.query.workspaceId as string;
  const format      = (req.query.format as string) ?? "pdf";
  const period      = (req.query.period as string) ?? "30d";

  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
  if (!["pdf", "xlsx"].includes(format)) return res.status(400).json({ error: "format must be pdf or xlsx" });

  try {
    const data = await collectReportData(workspaceId, period);
    const safeName = data.workspace.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const date     = new Date().toISOString().split("T")[0];

    if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="gtm_report_${safeName}_${date}.pdf"`);
      await generateGTMReportPDF(data, res);
    } else {
      res.setHeader("Content-Disposition", `attachment; filename="gtm_report_${safeName}_${date}.xlsx"`);
      await generateGTMReportXLSX(data, res);
    }
  } catch (err) {
    console.error("[reports/export]", err);
    if (!res.headersSent) res.status(500).json({ error: "Report generation failed" });
  }
});

export default router;
