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

    // 2) Prospecting Imports (Fixed: leadSource -> source)
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
      contactName: lead.contact ? `${lead.contact.firstName} ${lead.contact.lastName}` : (lead.fullName || "Unknown"),
      createdAt: lead.createdAt.toISOString(),
    }));

    res.json({
      stages: Object.values(stageMap),
      prospectingImports,
      recentJourneys,
    });

  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

export default router;