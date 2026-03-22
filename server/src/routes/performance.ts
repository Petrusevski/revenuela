import { Router, Request, Response } from "express";
import { prisma } from "../db";

const router = Router();

const TOOL_DISPLAY_MAP: Record<string, string> = {
  clay: "Clay",
  apollo: "Apollo",
  zoominfo: "ZoomInfo",
  pdl: "People Data Labs",
  heyreach: "HeyReach",
  lemlist: "Lemlist",
  instantly: "Instantly",
  smartlead: "Smartlead",
  hubspot: "HubSpot CRM",
  pipedrive: "Pipedrive",
  closecrm: "Close CRM",
  stripe: "Stripe",
  paddle: "Paddle",
  chargebee: "Chargebee",
  clearbit: "Clearbit",
  lusha: "Lusha",
  dropcontact: "Dropcontact",
};

const TOOL_CATEGORY_MAP: Record<string, string> = {
  clay: "Prospecting", apollo: "Prospecting", zoominfo: "Prospecting", pdl: "Prospecting",
  clearbit: "Enrichment", lusha: "Enrichment", dropcontact: "Enrichment",
  heyreach: "Outbound", lemlist: "Outbound", instantly: "Outbound", smartlead: "Outbound",
  hubspot: "CRM", pipedrive: "CRM", closecrm: "CRM",
  stripe: "Billing", paddle: "Billing", chargebee: "Billing",
};

const TOOL_ROLE_MAP: Record<string, string> = {
  clay: "Prospecting & enrichment",
  apollo: "Lead extraction",
  zoominfo: "Enterprise lists",
  pdl: "People data enrichment",
  heyreach: "LinkedIn sequences",
  lemlist: "Cold email",
  instantly: "Cold email engine",
  smartlead: "Cold email at scale",
  hubspot: "CRM & pipeline",
  pipedrive: "Sales pipeline",
  closecrm: "Inside sales CRM",
  stripe: "Payments & revenue",
  paddle: "Subscription billing",
  chargebee: "Subscription management",
  clearbit: "Data enrichment",
  lusha: "Contact intelligence",
  dropcontact: "Email enrichment",
};

/** Normalise a raw lead.source string to a lowercase tool ID */
function normalizeSource(raw: string | null): string {
  if (!raw) return "unknown";
  const s = raw.toLowerCase().trim();
  for (const key of Object.keys(TOOL_DISPLAY_MAP)) {
    if (s.includes(key)) return key;
  }
  if (s.includes("people data") || s === "pdl") return "pdl";
  return s.replace(/\s+/g, "_");
}

function formatCurrency(amount: number, currency: string | null | undefined) {
  const cur = currency || "EUR";
  const symbol = cur === "EUR" ? "€" : cur === "USD" ? "$" : cur + " ";
  return (
    symbol +
    Math.round(amount).toLocaleString("de-DE", { maximumFractionDigits: 0 })
  );
}

router.get("/", async (req: Request, res: Response) => {
  const workspaceId = String(req.query.workspaceId || "");

  if (!workspaceId) {
    return res.status(400).json({ error: "workspaceId is required" });
  }

  try {
    // 1) Connected integrations
    const integrations = await prisma.integrationConnection.findMany({
      where: { workspaceId, status: "connected" },
      select: { provider: true },
    });
    const connectedProviders = integrations
      .map((i) => normalizeSource(i.provider))
      .filter((p) => p !== "unknown");

    // 2) All leads for this workspace
    const allLeads = await prisma.lead.findMany({
      where: { workspaceId },
      select: { source: true, leadScore: true, fitScore: true, status: true },
    });

    // 3) Activity counts: all-time, today, this week — grouped by lead source
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const prevWeekStart = new Date(weekAgo);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    const allActivities = await prisma.activity.findMany({
      where: { workspaceId },
      select: { createdAt: true, lead: { select: { source: true } } },
    });

    // Group counts by source
    const totalBySource: Record<string, number> = {};
    const todayBySource: Record<string, number> = {};
    const weekBySource: Record<string, number> = {};
    const prevWeekBySource: Record<string, number> = {};

    for (const a of allActivities) {
      const src = normalizeSource((a.lead as any)?.source ?? null);
      totalBySource[src] = (totalBySource[src] || 0) + 1;
      if (a.createdAt >= today) todayBySource[src] = (todayBySource[src] || 0) + 1;
      if (a.createdAt >= weekAgo) weekBySource[src] = (weekBySource[src] || 0) + 1;
      if (a.createdAt >= prevWeekStart && a.createdAt < weekAgo)
        prevWeekBySource[src] = (prevWeekBySource[src] || 0) + 1;
    }

    // 4) Leads grouped by source
    const leadsBySource: Record<string, typeof allLeads> = {};
    for (const lead of allLeads) {
      const src = normalizeSource(lead.source);
      if (!leadsBySource[src]) leadsBySource[src] = [];
      leadsBySource[src].push(lead);
    }

    // 5) Won deals for MRR
    const wonDeals = await prisma.deal.findMany({
      where: { workspaceId, stage: "won" },
      select: { amount: true, currency: true },
    });
    const totalWonMrr = wonDeals.reduce((s, d) => s + (d.amount || 0), 0);
    const defaultCurrency = wonDeals[0]?.currency || "EUR";
    const totalCustomers = wonDeals.length;

    // 6) Build tool list for connected providers only
    const tools = connectedProviders
      .filter((p) => TOOL_DISPLAY_MAP[p])
      .map((provider) => {
        const leadsForTool = leadsBySource[provider] || [];
        const eventsTotal = totalBySource[provider] || 0;
        const eventsToday = todayBySource[provider] || 0;
        const eventsThisWeek = weekBySource[provider] || 0;
        const prevWeekCount = prevWeekBySource[provider] || 0;

        const scores = leadsForTool
          .map((l) => l.leadScore ?? l.fitScore ?? 0)
          .filter((s) => s > 0);
        const avgScore =
          scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;
        const hotSignals = leadsForTool.filter(
          (l) => (l.leadScore ?? l.fitScore ?? 0) >= 70
        ).length;

        // Trend vs previous week
        let trend: "up" | "down" | "flat" = "flat";
        let trendPct = 0;
        if (prevWeekCount > 0) {
          const delta = eventsThisWeek - prevWeekCount;
          trendPct = Math.abs(Math.round((delta / prevWeekCount) * 100));
          trend = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
        } else if (eventsThisWeek > 0) {
          trend = "up";
          trendPct = 100;
        }

        const status: "active" | "idle" | "error" =
          eventsToday > 0 ? "active" : eventsThisWeek > 0 ? "idle" : "idle";

        // Approximate MRR per tool (distribute evenly across active tools)
        const mrrPerTool =
          connectedProviders.length > 0
            ? totalWonMrr / connectedProviders.length
            : 0;

        return {
          id: provider,
          name: TOOL_DISPLAY_MAP[provider] || provider,
          displayName: TOOL_DISPLAY_MAP[provider] || provider,
          category: TOOL_CATEGORY_MAP[provider] || "Prospecting",
          role: TOOL_ROLE_MAP[provider] || "GTM tool",
          status,
          eventsTotal,
          eventsToday,
          eventsThisWeek,
          avgScore,
          hotSignals,
          trend,
          trendPct,
          leadsInfluenced: leadsForTool.length,
          customersWon: Math.round(
            totalCustomers > 0 && connectedProviders.length > 0
              ? totalCustomers / connectedProviders.length
              : 0
          ),
          mrr: formatCurrency(mrrPerTool, defaultCurrency),
          // Outreach-specific rates (derived from activity pattern — placeholder until webhooks)
          replyRate: 0,
          openRate: 0,
          meetingRate: 0,
        };
      });

    // Summary
    const prospectingCount = tools.filter((t) =>
      ["Prospecting"].includes(t.category)
    ).length;
    const outboundCount = tools.filter((t) =>
      ["Outbound"].includes(t.category)
    ).length;
    const totalLeadsInfluenced = tools.reduce(
      (s, t) => s + t.leadsInfluenced,
      0
    );

    // Top workflows
    const topWorkflows =
      totalWonMrr > 0
        ? [
            {
              id: "wf_combined_revenue",
              label: "Prospecting → Outbound → Closed Won",
              mrr: formatCurrency(totalWonMrr, defaultCurrency),
              customers: totalCustomers,
              summary: "Aggregated revenue from all currently active tools.",
            },
          ]
        : [];

    return res.json({
      tools,
      summary: {
        prospectingCount,
        outboundCount,
        totalLeadsInfluenced,
        totalMrrFormatted: formatCurrency(totalWonMrr, defaultCurrency),
      },
      topWorkflows,
    });
  } catch (err) {
    console.error("Error loading performance:", err);
    return res.status(500).json({ error: "Failed to load performance" });
  }
});

export default router;
