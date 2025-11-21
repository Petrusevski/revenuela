import { Router, Request, Response } from "express";
import { prisma } from "../db";

const router = Router();

// Helper to map raw activity.type into UI type union
const KNOWN_TYPES = new Set([
  "lead_imported",
  "id_synced",
  "reply_received",
  "sequence_started",
  "sequence_ended",
  "meeting_booked",
  "deal_won",
  "deal_lost",
]);

function normalizeType(rawType: string | null): string {
  if (!rawType) return "id_synced";
  const lower = rawType.toLowerCase();

  if (KNOWN_TYPES.has(rawType as any)) return rawType;

  if (lower.includes("lead") && lower.includes("import")) return "lead_imported";
  if (lower.includes("reply")) return "reply_received";
  if (lower.includes("meeting")) return "meeting_booked";
  if (lower.includes("won")) return "deal_won";
  if (lower.includes("lost") || lower.includes("churn"))
    return "deal_lost";
  if (lower.includes("start")) return "sequence_started";
  if (lower.includes("end") || lower.includes("stop"))
    return "sequence_ended";

  return "id_synced";
}

// For now, everything is "System" until you start tagging tool/source
function inferSource(_: string | null, __?: string | null): "System" {
  return "System";
}

function inferCategory(_: string): "System" {
  return "System";
}

router.get("/", async (req: Request, res: Response) => {
  const workspaceId = String(req.query.workspaceId || "");
  const limitRaw = String(req.query.limit || "100");
  const limit = Number.isNaN(parseInt(limitRaw, 10))
    ? 100
    : Math.min(500, Math.max(1, parseInt(limitRaw, 10)));

  if (!workspaceId) {
    return res.status(400).json({ error: "workspaceId is required" });
  }

  try {
    const activities = await prisma.activity.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        lead: true,
      },
    });

    const events = activities.map((a) => {
      const type = normalizeType(a.type);
      const source = inferSource(a.type, a.subject);
      const category = inferCategory(source);

      const ts = a.createdAt.toLocaleString("en-GB", {
        dateStyle: "short",
        timeStyle: "short",
      });

      const revenuelaId = a.leadId || undefined;
      const summary = a.subject || a.type || "Activity";
      const details = a.body || undefined;

      return {
        id: a.id,
        ts,
        source,
        category,
        type,
        revenuelaId,
        summary,
        details,
      };
    });

    return res.json({ events });
  } catch (err) {
    console.error("Error loading activity:", err);
    return res.status(500).json({ error: "Failed to load activity" });
  }
});

export default router;
