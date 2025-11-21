// server/src/routes/workflows.ts
import { Router, Request, Response } from "express";
import { prisma } from "../db"; // adjust import path if needed

const router = Router();

type AppStep = {
  appId: string;
  displayName: string;
  role?: string | null;
};

type WorkflowNodeApi = {
  id: string;
  label?: string | null;
  appId?: string | null;
  appName?: string | null;
  role?: string | null;
  orderIndex?: number | null;
};

router.get("/", async (req: Request, res: Response) => {
  const workspaceId = String(req.query.workspaceId || "");

  if (!workspaceId) {
    return res.status(400).json({ error: "workspaceId is required" });
  }

  try {
    const workflows = await prisma.workflow.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      include: {
        nodes: true,
        edges: true, // not used yet, but handy for later
      },
      take: 20,
    });

    const apiWorkflows = workflows.map((wf) => {
      const apps: AppStep[] = [];
      const nodes: WorkflowNodeApi[] = [];

      wf.nodes.forEach((node, index) => {
        let appId: string | null = null;
        let appName: string | null = null;
        let role: string | null = null;
        let orderIndex: number | null = null;

        if (node.config) {
          try {
            const cfg = JSON.parse(node.config) as {
              appId?: string;
              appName?: string;
              role?: string;
              orderIndex?: number;
            };

            if (cfg.appId) appId = cfg.appId;
            if (cfg.appName) appName = cfg.appName;
            if (cfg.role) role = cfg.role;
            if (typeof cfg.orderIndex === "number") orderIndex = cfg.orderIndex;
          } catch (e) {
            console.warn("Failed to parse workflow node config", e);
          }
        }

        const label = node.name;
        if (orderIndex === null) {
          // simple fallback order if none stored
          orderIndex = index;
        }

        nodes.push({
          id: node.id,
          label,
          appId,
          appName,
          role,
          orderIndex,
        });

        // Build app steps only for nodes that represent external apps
        if (appId || appName) {
          apps.push({
            appId: appId || appName || label || `node-${index}`,
            displayName: appName || label || appId || "Step",
            role,
          });
        }
      });

      // If for some reason we didn't find any app nodes, you still get nodes[]
      // and the frontend will fall back to nodes → displayName → dummy chain.

      return {
        id: wf.id,
        name: wf.name,
        summary: wf.description,
        description: wf.description,
        status: wf.status,
        triggerType: wf.triggerType,
        createdAt: wf.createdAt.toISOString(),
        updatedAt: wf.updatedAt.toISOString(),
        apps,
        nodes,
      };
    });

    return res.json({ workflows: apiWorkflows });
  } catch (err) {
    console.error("Error loading workflows:", err);
    return res.status(500).json({ error: "Failed to load workflows" });
  }
});

export default router;
