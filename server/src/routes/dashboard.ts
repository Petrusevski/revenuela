import { Router, Request, Response } from "express";
import { prisma } from "../db";

const router = Router();

const STAGE_BUCKETS = {
  prospecting: ["new", "cold", "prospect", "prospecting", "manual"],
  engaged: ["engaged", "reply", "responded", "opened", "active"],
  meeting: ["meeting", "demo", "call", "scheduled"],
  proposal: ["proposal", "negotiation", "quote"],
  won: ["won", "customer", "closed_won"],
  lost: ["lost", "churn", "closed_lost", "disqualified", "nurture"],
} as const;

type StageId = keyof typeof STAGE_BUCKETS;

function bucketStatus(statusRaw: string | null | undefined): StageId {
  const status = (statusRaw || "").toLowerCase();
  for (const [bucket, keywords] of Object.entries(STAGE_BUCKETS)) {
    if (keywords.some((k) => status.includes(k))) {
      return bucket as StageId;
    }
  }
  return "prospecting";
}

/** Normalise a raw lead.source string to a lowercase tool ID */
function normalizeSource(raw: string | null): string {
  if (!raw) return "unknown";
  const s = raw.toLowerCase().trim();
  const KNOWN = [
    "clay", "apollo", "heyreach", "lemlist", "instantly", "smartlead",
    "outreach", "replyio", "hubspot", "pipedrive", "closecrm", "salesforce",
    "attio", "airtable", "stripe", "paddle", "chargebee", "lemonsqueezy",
    "clearbit", "lusha", "dropcontact", "zoominfo", "cognism", "hunter",
    "phantombuster",
  ];
  for (const k of KNOWN) {
    if (s.includes(k)) return k;
  }
  if (s.includes("people data") || s === "pdl") return "pdl";
  if (s.includes("google") || s.includes("sheet")) return "google_sheets";
  return s.replace(/\s+/g, "_");
}

router.get("/", async (req: Request, res: Response) => {
  const workspaceId = String(req.query.workspaceId || "");

  if (!workspaceId) {
    return res.status(400).json({ error: "workspaceId is required" });
  }

  try {
    // 1) Stage Distribution
    const leads = await prisma.lead.findMany({
      where: { workspaceId },
      select: { id: true, status: true },
    });

    const stageMap: Record<StageId, { id: StageId; label: string; count: number }> = {
      prospecting: { id: "prospecting", label: "Prospecting", count: 0 },
      engaged: { id: "engaged", label: "Engaged", count: 0 },
      meeting: { id: "meeting", label: "Meetings", count: 0 },
      proposal: { id: "proposal", label: "Proposals", count: 0 },
      won: { id: "won", label: "Closed Won", count: 0 },
      lost: { id: "lost", label: "Lost", count: 0 },
    };

    for (const lead of leads) {
      const bucket = bucketStatus(lead.status);
      stageMap[bucket].count += 1;
    }

    // 2) Prospecting Imports by Source
    const importsBySource = await prisma.lead.groupBy({
      by: ["source"],
      where: { workspaceId },
      _count: { _all: true },
    });

    const prospectingImports = importsBySource
      .filter((row) => row.source !== null)
      .map((row) => ({
        id: row.source!.toLowerCase().replace(/\s+/g, "_"),
        source: row.source!,
        imports: row._count._all,
      }));

    // All-time lead counts per tool (used to mark a tool "active" even when today count is 0)
    const toolCountsTotal: Record<string, number> = {};
    for (const row of importsBySource) {
      if (row.source) {
        const src = normalizeSource(row.source);
        if (src !== "unknown") {
          toolCountsTotal[src] = (toolCountsTotal[src] || 0) + row._count._all;
        }
      }
    }

    // 3) Recent Journeys
    const recentLeads = await prisma.lead.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      include: { contact: true },
      take: 5,
    });

    const recentJourneys = recentLeads.map((lead) => ({
      id: lead.id,
      status: lead.status,
      contactName:
        lead.contact
          ? `${lead.contact.firstName} ${lead.contact.lastName}`
          : lead.fullName || "Unknown",
      createdAt: lead.createdAt.toISOString(),
    }));

    // 4) Tool activity counts for today (used by DashboardPage tool health cards)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayActivities = await prisma.activity.findMany({
      where: { workspaceId, createdAt: { gte: today } },
      include: { lead: { select: { source: true } } },
    });

    const toolCountsToday: Record<string, number> = {};
    for (const a of todayActivities) {
      const src = normalizeSource((a.lead as any)?.source ?? null);
      if (src !== "unknown") {
        toolCountsToday[src] = (toolCountsToday[src] || 0) + 1;
      }
    }

    // 5) Tools synced today — IntegrationConnection.updatedAt is stamped on every sync run.
    //    A provider synced today is shown as "active" even if no new contacts were imported.
    const todayConnections = await prisma.integrationConnection.findMany({
      where: { workspaceId, status: "connected", updatedAt: { gte: today } },
      select: { provider: true },
    });
    const toolSyncedToday: string[] = todayConnections.map((c) => c.provider.toLowerCase());

    res.json({
      stages: Object.values(stageMap),
      prospectingImports,
      recentJourneys,
      toolCountsToday,
      toolCountsTotal,
      toolSyncedToday,
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

export default router;
