import { Router, Request, Response } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

const MAP_WORKFLOW_NAME = "__gtm_flow_map__";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/workflow-map?workspaceId=
// Returns the workspace's GTM stacks + connected tools
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const workspaceId = req.query.workspaceId as string;
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });

  try {
    const [workflow, connections] = await Promise.all([
      prisma.workflow.findFirst({
        where: { workspaceId, name: MAP_WORKFLOW_NAME },
      }),
      prisma.integrationConnection.findMany({
        where: { workspaceId, status: "connected" },
        select: { provider: true },
      }),
    ]);

    const connectedTools = connections.map(c => c.provider);

    let stacks: unknown[] = [];
    if (workflow?.triggerConfig) {
      const parsed = JSON.parse(workflow.triggerConfig);
      // v1 compat: if stored as plain array of steps, migrate to single stack
      if (Array.isArray(parsed)) {
        stacks = parsed.length > 0
          ? [{ id: "migrated", name: "My GTM Stack", steps: parsed, createdAt: new Date().toISOString() }]
          : [];
      } else if (parsed?.version === 2 && Array.isArray(parsed.stacks)) {
        stacks = parsed.stacks;
      }
    }

    return res.json({ stacks, connectedTools });
  } catch (err) {
    console.error("[workflow-map GET]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/workflow-map
// Body: { workspaceId, stacks: WorkflowStack[] }
// Creates or updates the GTM flow map
// ─────────────────────────────────────────────────────────────────────────────
router.put("/", requireAuth, async (req: Request, res: Response) => {
  const { workspaceId, stacks } = req.body as { workspaceId: string; stacks: unknown[] };
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });

  try {
    const existing = await prisma.workflow.findFirst({
      where: { workspaceId, name: MAP_WORKFLOW_NAME },
    });

    const payload = JSON.stringify({ version: 2, stacks: stacks ?? [] });

    if (existing) {
      await prisma.workflow.update({
        where: { id: existing.id },
        data: { triggerConfig: payload, updatedAt: new Date() },
      });
      return res.json({ id: existing.id });
    } else {
      const created = await prisma.workflow.create({
        data: {
          workspaceId,
          name:          MAP_WORKFLOW_NAME,
          description:   "GTM workflow map — defined by user for iqpipe context",
          status:        "active",
          triggerType:   "map",
          triggerConfig: payload,
        },
      });
      return res.json({ id: created.id });
    }
  } catch (err) {
    console.error("[workflow-map PUT]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
