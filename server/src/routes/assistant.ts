// server/src/routes/assistant.ts

import { Router } from "express";
import { REVENUELA_SYSTEM_PROMPT } from "../ai/prompt";
import { openai } from "../services/openaiClient";
import { prisma } from "../db";

const router = Router();

// Constants shared with performance.ts logic
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

/**
 * Helper to strip markdown code blocks from LLM output
 */
function cleanJsonOutput(raw: string): string {
  // Remove ```json at start and ``` at end, or just ```
  return raw.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
}

/**
 * Helper: build a rich workspace context object
 */
async function buildWorkspaceContext(workspaceId?: string) {
  const workspaceContext: any = {
    counts: {},
    toolStats: [],
  };

  if (!workspaceId) return workspaceContext;

  try {
    // 1. Fetch Workflows
    const workflows = await prisma.workflow.findMany({
      where: { workspaceId },
      include: { nodes: true, edges: true },
      take: 20,
    });

    workspaceContext.workflows = workflows.map((w: any) => ({
      id: w.id,
      name: w.name,
      status: w.status,
      summary: w.summary,
      nodes: (w.nodes || []).map((n: any) => ({
        id: n.id,
        appId: n.appId,
        type: n.type,
        label: n.label,
      })),
    }));
    workspaceContext.counts.workflows = workflows.length;

    // 2. Fetch Lead Counts & Revenue
    const [leadCount, wonDeals, integrations] = await Promise.all([
      (prisma as any).lead?.count({ where: { workspaceId } }).catch(() => 0),
      prisma.deal.findMany({ where: { workspaceId, stage: "won" } }),
      prisma.integrationConnection.findMany({
        where: { workspaceId },
        select: { provider: true },
      }),
    ]);

    workspaceContext.counts.leads = leadCount;
    workspaceContext.counts.wonDeals = wonDeals.length;
    
    // 3. Calculate Stats for Context
    const connectedProviders = integrations
      .map((i) => (i.provider || "").toLowerCase())
      .filter(Boolean);

    const activeProspecting = PROSPECTING_PROVIDERS.filter((p) =>
      connectedProviders.includes(p)
    );
    const activeOutbound = OUTBOUND_PROVIDERS.filter((p) =>
      connectedProviders.includes(p)
    );

    const totalWonMrr = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    const approxLeadsInfluenced = Math.round(leadCount * 0.6);
    const halfLeads = Math.round(approxLeadsInfluenced / 2);

    if (activeProspecting.length > 0) {
      const leadsPer = Math.floor(halfLeads / activeProspecting.length);
      const mrrPer = Math.round(totalWonMrr / 2 / activeProspecting.length);
      activeProspecting.forEach(provider => {
        workspaceContext.toolStats.push({
          toolId: provider,
          name: PROVIDER_LABELS[provider] || provider,
          category: "Prospecting",
          leadsInfluenced: leadsPer,
          mrrInfluenced: mrrPer,
        });
      });
    }

    if (activeOutbound.length > 0) {
      const leadsPer = Math.floor(halfLeads / activeOutbound.length);
      const mrrPer = Math.round(totalWonMrr / 2 / activeOutbound.length);
      activeOutbound.forEach(provider => {
        workspaceContext.toolStats.push({
          toolId: provider,
          name: PROVIDER_LABELS[provider] || provider,
          category: "Outbound",
          leadsInfluenced: leadsPer,
          mrrInfluenced: mrrPer,
        });
      });
    }

    workspaceContext.totalMrr = totalWonMrr;

  } catch (err) {
    console.warn("analysis-agent: context build failed", err);
  }

  return workspaceContext;
}

router.post("/analysis-agent", async (req, res) => {
  try {
    const { userMessage, workspaceId } = req.body || {};

    if (!userMessage) {
      return res.status(400).json({ error: "Missing userMessage" });
    }

    const effectiveWorkspaceId = workspaceId?.trim() || undefined;
    const workspaceContext = await buildWorkspaceContext(effectiveWorkspaceId);

    const userPrompt = `
User question: ${userMessage}

Workspace context (JSON):
${JSON.stringify(workspaceContext, null, 2)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or gpt-4-turbo
      temperature: 0.2,
      messages: [
        { role: "system", content: REVENUELA_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    const cleaned = cleanJsonOutput(raw);
    
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Fallback if parsing fails
      parsed = {
        analysis: raw, // Send raw text so user sees something
        keyFindings: [],
        suggestedExperiments: [],
        warnings: ["Response format error"],
        metricsReference: { toolsMentioned: [], workflowsMentioned: [] },
      };
    }

    if (!parsed.analysis || typeof parsed.analysis !== "string") {
      parsed.analysis = "The AI provided data but no text analysis.";
    }

    return res.json(parsed);
  } catch (err: any) {
    console.error("analysis-agent error", err);
    return res.status(500).json({ error: "Internal AI error" });
  }
});

export default router;