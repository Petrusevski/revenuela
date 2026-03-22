import { Router, Request, Response } from "express";
import { prisma } from "../db";

const router = Router();

// ─── Type Normalization ───────────────────────────────────────────────────────

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
  if (lower.includes("lost") || lower.includes("churn")) return "deal_lost";
  if (lower.includes("start")) return "sequence_started";
  if (lower.includes("end") || lower.includes("stop")) return "sequence_ended";
  return "id_synced";
}

// ─── Tool Metadata ────────────────────────────────────────────────────────────

const TOOL_DISPLAY_MAP: Record<string, string> = {
  clay: "Clay",
  apollo: "Apollo",
  heyreach: "HeyReach",
  lemlist: "Lemlist",
  instantly: "Instantly",
  smartlead: "Smartlead",
  outreach: "Outreach",
  replyio: "Reply.io",
  hubspot: "HubSpot CRM",
  pipedrive: "Pipedrive",
  closecrm: "Close CRM",
  salesforce: "Salesforce",
  attio: "Attio",
  airtable: "Airtable",
  stripe: "Stripe",
  paddle: "Paddle",
  chargebee: "Chargebee",
  lemonsqueezy: "LemonSqueezy",
  clearbit: "Clearbit",
  lusha: "Lusha",
  dropcontact: "Dropcontact",
  zoominfo: "ZoomInfo",
  cognism: "Cognism",
  hunter: "Hunter.io",
  phantombuster: "PhantomBuster",
  pdl: "People Data Labs",
  google_sheets: "Google Sheets",
};

const TOOL_CATEGORY_MAP: Record<string, string> = {
  clay: "prospecting",
  apollo: "prospecting",
  zoominfo: "prospecting",
  pdl: "prospecting",
  phantombuster: "prospecting",
  clearbit: "enrichment",
  lusha: "enrichment",
  dropcontact: "enrichment",
  cognism: "enrichment",
  hunter: "enrichment",
  heyreach: "outreach",
  lemlist: "outreach",
  instantly: "outreach",
  smartlead: "outreach",
  outreach: "outreach",
  replyio: "outreach",
  hubspot: "crm",
  pipedrive: "crm",
  closecrm: "crm",
  salesforce: "crm",
  attio: "crm",
  airtable: "crm",
  stripe: "billing",
  paddle: "billing",
  chargebee: "billing",
  lemonsqueezy: "billing",
};

/** Normalise a raw lead.source string to a lowercase tool ID */
function normalizeSource(raw: string | null): string {
  if (!raw) return "unknown";
  const s = raw.toLowerCase().trim();
  // Direct map
  if (TOOL_DISPLAY_MAP[s]) return s;
  // Partial match
  for (const key of Object.keys(TOOL_DISPLAY_MAP)) {
    if (s.includes(key)) return key;
  }
  if (s.includes("people data") || s === "pdl") return "pdl";
  if (s.includes("google") || s.includes("sheet")) return "google_sheets";
  return s.replace(/\s+/g, "_");
}

function scoreFromLead(lead: any): number | null {
  // fitScore is the single source of truth — set by the ICP engine + activity deltas.
  // leadScore is a legacy per-tool heuristic and is intentionally ignored here.
  if (lead?.fitScore != null) return lead.fitScore;
  return null; // not yet ICP-scored
}

// ─── Route ────────────────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response) => {
  const workspaceId = String(req.query.workspaceId || "");
  const limitRaw = String(req.query.limit || "100");
  const limit = Math.min(500, Math.max(1, parseInt(limitRaw, 10) || 100));

  if (!workspaceId) {
    return res.status(400).json({ error: "workspaceId is required" });
  }

  try {
    const activities = await prisma.activity.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        lead: {
          include: {
            contact: true,
            account: true,
          },
        },
      },
    });

    const events = activities.map((a) => {
      const type = normalizeType(a.type);
      const lead = a.lead as any;

      // Resolve tool
      const toolId = normalizeSource(lead?.source ?? null);
      const toolDisplayName = TOOL_DISPLAY_MAP[toolId] || lead?.source || "System";
      const toolCategory = TOOL_CATEGORY_MAP[toolId] || "prospecting";

      // Resolve contact info
      const contactName =
        lead?.fullName ||
        (lead?.contact
          ? `${lead.contact.firstName} ${lead.contact.lastName}`.trim()
          : null) ||
        a.subject ||
        "Unknown";
      const contactEmail = lead?.email || lead?.contact?.email || "";
      const company =
        lead?.company || lead?.account?.name || a.subject || "";

      // Signal score
      const score = scoreFromLead(lead);

      // Raw fields from body JSON or fallback
      let rawFields: Record<string, string> = {};
      if (a.body) {
        try {
          rawFields = JSON.parse(a.body);
        } catch {
          rawFields = { details: a.body.slice(0, 200) };
        }
      }
      if (a.type) rawFields.event_type = a.type;
      if (lead?.source) rawFields.source = lead.source;

      return {
        id: a.id,
        ts: a.createdAt.toISOString(),
        tool: toolId,
        toolDisplayName,
        toolCategory,
        type,
        contactName,
        contactEmail,
        company,
        score,
        summary: a.subject || a.type || "Activity",
        rawFields,
        iqpipeId: a.leadId || undefined,
        details: a.body || undefined,
      };
    });

    return res.json({ events });
  } catch (err) {
    console.error("Error loading activity:", err);
    return res.status(500).json({ error: "Failed to load activity" });
  }
});

export default router;
