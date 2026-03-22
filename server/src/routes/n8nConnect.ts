/**
 * n8nConnect.ts
 *
 * Routes for connecting/disconnecting a user's n8n instance.
 *
 * Auth: JWT Bearer token. workspaceId comes from body or query param.
 *
 * POST   /api/n8n-connect/connect     — save API key + baseUrl, test, store
 * DELETE /api/n8n-connect             — disconnect and remove all workflow metadata
 * GET    /api/n8n-connect/status      — connection status + last sync info
 * POST   /api/n8n-connect/sync        — trigger manual sync on-demand
 * GET    /api/n8n-connect/workflows   — list N8nWorkflowMeta for this workspace
 */

import { Router, Request, Response } from "express";
import { prisma } from "../db";
import { encrypt } from "../utils/encryption";
import { testN8nConnection, syncN8nConnection } from "../services/n8nClient";

const router = Router();

// ── Resolve workspaceId from body or query param ──────────────────────────────
function getWorkspaceId(req: Request): string {
  return (req.body?.workspaceId as string) || (req.query.workspaceId as string) || "";
}

// ── POST /api/n8n-connect/connect ─────────────────────────────────────────────

router.post("/connect", async (req: Request, res: Response) => {
  const workspaceId = getWorkspaceId(req);
  const { baseUrl, apiKey } = req.body as { baseUrl?: string; apiKey?: string };

  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" }) as any;
  if (!baseUrl || !apiKey) return res.status(400).json({ error: "baseUrl and apiKey required" }) as any;

  // Normalise baseUrl
  const cleanBase = baseUrl.trim().replace(/\/+$/, "");
  if (!cleanBase.startsWith("http")) {
    return res.status(400).json({ error: "baseUrl must start with http:// or https://" }) as any;
  }

  // Test connection before saving
  const test = await testN8nConnection(cleanBase, apiKey.trim());
  if (!test.ok) {
    return res.status(400).json({ error: `Cannot reach n8n instance: ${test.error}` }) as any;
  }

  const apiKeyEnc = encrypt(apiKey.trim());

  await prisma.n8nConnection.upsert({
    where:  { workspaceId },
    create: { workspaceId, baseUrl: cleanBase, apiKeyEnc, status: "connected" },
    update: { baseUrl: cleanBase, apiKeyEnc, status: "connected", lastError: null },
  });

  // Kick off initial sync in background (don't await)
  syncN8nConnection(workspaceId).catch(console.error);

  return res.json({ ok: true, message: "Connected — syncing workflows in background" });
});

// ── DELETE /api/n8n-connect ───────────────────────────────────────────────────

router.delete("/", async (req: Request, res: Response) => {
  const workspaceId = getWorkspaceId(req);
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" }) as any;

  await prisma.n8nWorkflowMeta.deleteMany({ where: { workspaceId } });
  await prisma.n8nConnection.deleteMany({ where: { workspaceId } });

  return res.json({ ok: true });
});

// ── GET /api/n8n-connect/status ───────────────────────────────────────────────

router.get("/status", async (req: Request, res: Response) => {
  const workspaceId = getWorkspaceId(req);
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" }) as any;

  const conn = await prisma.n8nConnection.findUnique({
    where:  { workspaceId },
    select: {
      baseUrl: true, authType: true, status: true,
      lastSyncAt: true, lastError: true, workflowCount: true, createdAt: true,
    },
  });

  if (!conn) return res.json({ connected: false });

  return res.json({
    connected:      conn.status !== "disconnected",
    status:         conn.status,
    baseUrl:        conn.baseUrl,
    authType:       conn.authType,
    lastSyncAt:     conn.lastSyncAt?.toISOString() ?? null,
    lastError:      conn.lastError,
    workflowCount:  conn.workflowCount,
    connectedSince: conn.createdAt.toISOString(),
  });
});

// ── POST /api/n8n-connect/sync ────────────────────────────────────────────────

router.post("/sync", async (req: Request, res: Response) => {
  const workspaceId = getWorkspaceId(req);
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" }) as any;

  const conn = await prisma.n8nConnection.findUnique({ where: { workspaceId } });
  if (!conn) return res.status(404).json({ error: "No n8n connection found" }) as any;

  try {
    const result = await syncN8nConnection(workspaceId);
    return res.json({ ok: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/n8n-connect/workflows ────────────────────────────────────────────

router.get("/workflows", async (req: Request, res: Response) => {
  const workspaceId = getWorkspaceId(req);
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" }) as any;

  const workflows = await prisma.n8nWorkflowMeta.findMany({
    where:   { workspaceId },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true, n8nId: true, name: true, active: true,
      tags: true, appsUsed: true, nodeCount: true,
      triggerType: true, description: true,
      lastUpdatedAt: true, syncedAt: true,
    },
  });

  return res.json(
    workflows.map(w => ({
      ...w,
      tags:          JSON.parse(w.tags),
      appsUsed:      JSON.parse(w.appsUsed),
      lastUpdatedAt: w.lastUpdatedAt?.toISOString() ?? null,
      syncedAt:      w.syncedAt.toISOString(),
    }))
  );
});

export default router;
