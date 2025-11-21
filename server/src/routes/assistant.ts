// server/src/routes/assistant.ts

import { Router } from "express";
import { REVENUELA_SYSTEM_PROMPT } from "../ai/prompt";
import { openai } from "../services/openaiClient";
import { prisma } from "../db";

const router = Router();

/**
 * Helper: build a lightweight workspace context object
 * for the AI to analyze. All DB calls are wrapped in try/catch
 * so missing tables or fields won't crash the endpoint.
 */
async function buildWorkspaceContext(workspaceId?: string) {
  const workspaceContext: any = {
    counts: {},
  };

  // Workflows + nodes + edges (if model exists)
  try {
    const workflows = await prisma.workflow.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      include: {
        nodes: true,
        edges: true,
      },
      take: 50,
    });

    // Reduce to a lighter structure so we don't send massive payloads
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
      edges: (w.edges || []).map((e: any) => ({
        id: e.id,
        sourceId: e.sourceNodeId ?? e.sourceId,
        targetId: e.targetNodeId ?? e.targetId,
      })),
    }));

    workspaceContext.counts.workflows = workflows.length;
  } catch (err) {
    console.warn("analysis-agent: workflows not available or query failed");
  }

  // Lead count (if leads table exists)
  try {
    const leadCount = await (prisma as any).lead?.count({
      where: workspaceId ? { workspaceId } : undefined,
    });
    if (typeof leadCount === "number") {
      workspaceContext.counts.leads = leadCount;
    }
  } catch {
    console.warn("analysis-agent: leads count not available");
  }

  // Activity log count (if activity table exists)
  try {
    const activityCount = await (prisma as any).activityEvent?.count({
      where: workspaceId ? { workspaceId } : undefined,
    });
    if (typeof activityCount === "number") {
      workspaceContext.counts.activityEvents = activityCount;
    }
  } catch {
    console.warn("analysis-agent: activity events not available");
  }

  // TODO: once you have a dedicated tool_stats table, fetch it here:
  // try {
  //   const toolStats = await prisma.toolStat.findMany({ where: { workspaceId } });
  //   workspaceContext.toolStats = toolStats;
  // } catch { ... }

  return workspaceContext;
}

/**
 * POST /api/assistant/analysis-agent
 *
 * Body:
 * {
 *   "userMessage": string,
 *   "workspaceId"?: string
 * }
 */
router.post("/analysis-agent", async (req, res) => {
  try {
    const { userMessage, workspaceId } = req.body || {};

    if (!userMessage || typeof userMessage !== "string") {
      return res
        .status(400)
        .json({ error: "Missing required field: userMessage (string)" });
    }

    const effectiveWorkspaceId =
      typeof workspaceId === "string" && workspaceId.trim().length > 0
        ? workspaceId.trim()
        : undefined;

    const workspaceContext = await buildWorkspaceContext(effectiveWorkspaceId);

    const userPrompt = `
User question:
${userMessage}

Workspace context (JSON):
${JSON.stringify(workspaceContext, null, 2)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: REVENUELA_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    let parsed: any;

    try {
      parsed = JSON.parse(raw);
    } catch {
      // If the model returned plain text, wrap it in the expected JSON shape
      parsed = {
        analysis: raw || "No analysis returned by the model.",
        keyFindings: [],
        suggestedExperiments: [],
        warnings: [
          "Model did not return valid JSON; response has been wrapped automatically.",
        ],
        metricsReference: {
          toolsMentioned: [],
          workflowsMentioned: [],
        },
      };
    }

    // Ensure analysis string exists for the frontend
    if (!parsed.analysis || typeof parsed.analysis !== "string") {
      parsed.analysis =
        "The AI did not provide a top-level analysis string. Please try asking again with a more specific question.";
    }

    return res.json(parsed);
  } catch (err: any) {
    console.error("analysis-agent error", err);
    return res.status(500).json({
      error: "Internal AI error",
      details: err?.message || "Unknown error",
    });
  }
});

export default router;
