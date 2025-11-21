import { Router, Request, Response } from "express";
import { prisma } from "../db";

const router = Router();

const PROSPECTING_PROVIDERS = ["clay", "apollo", "zoominfo"];
const OUTBOUND_PROVIDERS = ["heyreach", "lemlist", "instantly"];

const PROVIDER_LABELS: Record<string, string> = {
  clay: "Clay",
  apollo: "Apollo",
  zoominfo: "ZoomInfo",
  heyreach: "HeyReach",
  lemlist: "Lemlist",
  instantly: "Instantly",
};

const PROVIDER_ROLES: Record<string, string> = {
  clay: "Prospecting & enrichment",
  apollo: "Lead extraction",
  zoominfo: "Enterprise lists",
  heyreach: "LinkedIn sequences",
  lemlist: "Cold email",
  instantly: "Cold email engine",
};

type ToolPerfApi = {
  id: string;
  name: string;
  category: "Prospecting" | "Outbound";
  role: string;
  leadsInfluenced: number;
  customersWon: number;
  mrr: string;
  replyRate?: string;
  meetingRate?: string;
};

type TopWorkflowApi = {
  id: string;
  label: string;
  mrr: string;
  customers: number;
  summary: string;
};

function formatCurrency(amount: number, currency: string | null | undefined) {
  const cur = currency || "EUR";
  const symbol = cur === "EUR" ? "€" : cur + " ";
  return (
    symbol +
    Math.round(amount).toLocaleString("de-DE", {
      maximumFractionDigits: 0,
    })
  );
}

router.get("/", async (req: Request, res: Response) => {
  const workspaceId = String(req.query.workspaceId || "");

  if (!workspaceId) {
    return res.status(400).json({ error: "workspaceId is required" });
  }

  try {
    // 1) Get connected integrations for this workspace
    const integrations = await prisma.integrationConnection.findMany({
      where: { workspaceId },
    });

    const connectedProviders = integrations
      .map((i) => (i.provider || "").toLowerCase())
      .filter(Boolean);

    // 2) Basic workspace metrics
    const [leadCount, wonDeals] = await Promise.all([
      prisma.lead.count({ where: { workspaceId } }),
      prisma.deal.findMany({
        where: {
          workspaceId,
          // use stage / closedAt heuristic for "won"
        stage: { equals: "won" }
        },
      }),
    ]);

    const totalWonMrr = wonDeals.reduce(
      (sum, d) => sum + (d.amount || 0),
      0
    );
    const totalCustomers = wonDeals.length;
    const defaultCurrency =
      (wonDeals[0] && wonDeals[0].currency) || "EUR";

    // For now, we approximate "leads influenced in last 30d" as a fraction
    // of total leads. Later you can use Activities / SequenceEnrollments.
    const approxLeadsInfluenced = Math.round(leadCount * 0.6);

    // 3) Build tool list
    const tools: ToolPerfApi[] = [];

    const prospectingTools: string[] = PROSPECTING_PROVIDERS.filter((p) =>
      connectedProviders.includes(p)
    );
    const outboundTools: string[] = OUTBOUND_PROVIDERS.filter((p) =>
      connectedProviders.includes(p)
    );

    const prospectingCount = prospectingTools.length || PROSPECTING_PROVIDERS.length;
    const outboundCount = outboundTools.length || OUTBOUND_PROVIDERS.length;

    const effectiveProspecting = prospectingTools.length
      ? prospectingTools
      : PROSPECTING_PROVIDERS;
    const effectiveOutbound = outboundTools.length
      ? outboundTools
      : OUTBOUND_PROVIDERS;

    const halfLeads = Math.round(approxLeadsInfluenced / 2);
    const prospectingLeadsPerTool = Math.max(
      0,
      Math.floor(halfLeads / effectiveProspecting.length)
    );
    const outboundLeadsPerTool = Math.max(
      0,
      Math.floor(halfLeads / effectiveOutbound.length)
    );

    const prospectingMrrPerTool = Math.max(
      0,
      totalWonMrr / 2 / (effectiveProspecting.length || 1)
    );
    const outboundMrrPerTool = Math.max(
      0,
      totalWonMrr / 2 / (effectiveOutbound.length || 1)
    );
    const customersPerTool = Math.max(
      0,
      Math.floor(totalCustomers / (effectiveProspecting.length + effectiveOutbound.length || 1))
    );

    // Prospecting tools
    for (const provider of effectiveProspecting) {
      tools.push({
        id: provider,
        name: PROVIDER_LABELS[provider] || provider,
        category: "Prospecting",
        role: PROVIDER_ROLES[provider] || "Prospecting",
        leadsInfluenced: prospectingLeadsPerTool,
        customersWon: customersPerTool,
        mrr: formatCurrency(prospectingMrrPerTool, defaultCurrency),
        meetingRate: undefined, // can be filled from Activities later
      });
    }

    // Outbound tools
    for (const provider of effectiveOutbound) {
      tools.push({
        id: provider,
        name: PROVIDER_LABELS[provider] || provider,
        category: "Outbound",
        role: PROVIDER_ROLES[provider] || "Outbound",
        leadsInfluenced: outboundLeadsPerTool,
        customersWon: customersPerTool,
        mrr: formatCurrency(outboundMrrPerTool, defaultCurrency),
        replyRate: undefined, // can be filled from Activities later
        meetingRate: undefined,
      });
    }

    // 4) Top workflows – for now we use a simple stub based on actual totals
    // Later, you can replace this with real workflow scoring logic.
    const topWorkflows: TopWorkflowApi[] = [];

    if (totalWonMrr > 0) {
      topWorkflows.push({
        id: "wf_prospecting_outbound_stripe",
        label: "Prospecting → Outbound → CRM → Billing",
        mrr: formatCurrency(totalWonMrr, defaultCurrency),
        customers: totalCustomers,
        summary:
          "Summed from all workflows that result in closed won deals in this workspace.",
      });
    }

    const response = {
      tools,
      summary: {
        prospectingCount,
        outboundCount,
        totalLeadsInfluenced: approxLeadsInfluenced,
        totalMrrFormatted: formatCurrency(totalWonMrr, defaultCurrency),
      },
      topWorkflows,
    };

    return res.json(response);
  } catch (err) {
    console.error("Error loading performance:", err);
    return res.status(500).json({ error: "Failed to load performance" });
  }
});

export default router;
