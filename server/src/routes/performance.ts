import { Router, Request, Response } from "express";
import { prisma } from "../db";

const router = Router();

// These lists are now used ONLY for categorization, not for populating the view by default.
const PROSPECTING_PROVIDERS_LIST = ["clay", "apollo", "zoominfo"];
const OUTBOUND_PROVIDERS_LIST = ["heyreach", "lemlist", "instantly"];

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
    // 1) Get ONLY connected integrations for this workspace
    const integrations = await prisma.integrationConnection.findMany({
      where: { workspaceId },
      select: { provider: true },
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
          stage: { equals: "won" },
        },
      }),
    ]);

    const totalWonMrr = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalCustomers = wonDeals.length;
    const defaultCurrency = (wonDeals[0] && wonDeals[0].currency) || "EUR";

    // Approx leads influenced (Logic can be updated to count leads by source later)
    const approxLeadsInfluenced = Math.round(leadCount * 0.6);

    // 3) Build tool list based STRICTLY on connected providers
    const tools: ToolPerfApi[] = [];

    // Filter the known categories against what is actually in the DB
    const activeProspecting = PROSPECTING_PROVIDERS_LIST.filter((p) =>
      connectedProviders.includes(p)
    );
    const activeOutbound = OUTBOUND_PROVIDERS_LIST.filter((p) =>
      connectedProviders.includes(p)
    );

    const prospectingCount = activeProspecting.length;
    const outboundCount = activeOutbound.length;
    const totalActiveTools = prospectingCount + outboundCount;

    // Distribute metrics only if tools exist
    const halfLeads = Math.round(approxLeadsInfluenced / 2);
    
    const prospectingLeadsPerTool = prospectingCount > 0 
      ? Math.max(0, Math.floor(halfLeads / prospectingCount)) 
      : 0;
      
    const outboundLeadsPerTool = outboundCount > 0 
      ? Math.max(0, Math.floor(halfLeads / outboundCount)) 
      : 0;

    const prospectingMrrPerTool = prospectingCount > 0 
      ? Math.max(0, totalWonMrr / 2 / prospectingCount) 
      : 0;
      
    const outboundMrrPerTool = outboundCount > 0 
      ? Math.max(0, totalWonMrr / 2 / outboundCount) 
      : 0;
      
    const customersPerTool = totalActiveTools > 0 
      ? Math.max(0, Math.floor(totalCustomers / totalActiveTools)) 
      : 0;

    // Build Prospecting Response
    for (const provider of activeProspecting) {
      tools.push({
        id: provider,
        name: PROVIDER_LABELS[provider] || provider,
        category: "Prospecting",
        role: PROVIDER_ROLES[provider] || "Prospecting",
        leadsInfluenced: prospectingLeadsPerTool,
        customersWon: customersPerTool,
        mrr: formatCurrency(prospectingMrrPerTool, defaultCurrency),
        meetingRate: undefined,
      });
    }

    // Build Outbound Response
    for (const provider of activeOutbound) {
      tools.push({
        id: provider,
        name: PROVIDER_LABELS[provider] || provider,
        category: "Outbound",
        role: PROVIDER_ROLES[provider] || "Outbound",
        leadsInfluenced: outboundLeadsPerTool,
        customersWon: customersPerTool,
        mrr: formatCurrency(outboundMrrPerTool, defaultCurrency),
        replyRate: undefined,
        meetingRate: undefined,
      });
    }

    // 4) Top workflows
    // Only show workflows if we actually have revenue
    const topWorkflows: TopWorkflowApi[] = [];

    if (totalWonMrr > 0) {
      topWorkflows.push({
        id: "wf_combined_revenue",
        label: "Prospecting → Outbound → Closed Won",
        mrr: formatCurrency(totalWonMrr, defaultCurrency),
        customers: totalCustomers,
        summary: "Aggregated revenue from all currently active tools.",
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