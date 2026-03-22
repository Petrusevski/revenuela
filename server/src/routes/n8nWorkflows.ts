/**
 * n8nWorkflows.ts
 *
 * Workflow- and step-level performance analytics for events ingested via
 * the n8n integration layer.
 *
 * All routes authenticate via the workspace's public API key:
 *   Authorization: Bearer {publicApiKey}
 *
 * Routes:
 *   GET  /api/n8n/workflows              — list all workflows seen in the workspace
 *   GET  /api/n8n/workflows/:workflowId  — detailed stats + step breakdown
 *   GET  /api/n8n/queue/stats            — live queue depth and status counts
 */

import { Router, Request, Response } from "express";
import { prisma } from "../db";

const router = Router();

// ── Auth helper ───────────────────────────────────────────────────────────────

async function resolveWorkspace(req: Request): Promise<string | null> {
  const header = (req.headers.authorization || "").trim();
  const token  = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const ws = await prisma.workspace.findFirst({
    where:  { publicApiKey: token },
    select: { id: true },
  });
  return ws?.id ?? null;
}

// ── GET /api/n8n/workflows ────────────────────────────────────────────────────
// Returns all distinct workflows seen for this workspace with aggregate counts.

router.get("/workflows", async (req: Request, res: Response) => {
  const workspaceId = await resolveWorkspace(req);
  if (!workspaceId) return res.status(401).json({ error: "Invalid API key" });

  // Group by workflowId
  const rows = await prisma.n8nQueuedEvent.groupBy({
    by:      ["workflowId"],
    where:   { workspaceId },
    _count:  { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  // For each workflowId also grab the most recent event and status breakdown
  const workflows = await Promise.all(
    rows.map(async (row) => {
      const [last, statusCounts, appCounts] = await Promise.all([
        prisma.n8nQueuedEvent.findFirst({
          where:   { workspaceId, workflowId: row.workflowId },
          orderBy: { createdAt: "desc" },
          select:  { createdAt: true, sourceApp: true, eventType: true },
        }),
        prisma.n8nQueuedEvent.groupBy({
          by:     ["status"],
          where:  { workspaceId, workflowId: row.workflowId },
          _count: { id: true },
        }),
        prisma.n8nQueuedEvent.groupBy({
          by:     ["sourceApp"],
          where:  { workspaceId, workflowId: row.workflowId },
          _count: { id: true },
        }),
      ]);

      const statusMap = Object.fromEntries(
        statusCounts.map(s => [s.status, s._count.id])
      );

      return {
        workflowId:  row.workflowId,
        totalEvents: row._count.id,
        done:        statusMap.done        ?? 0,
        pending:     statusMap.pending     ?? 0,
        processing:  statusMap.processing  ?? 0,
        failed:      statusMap.failed      ?? 0,
        successRate: row._count.id > 0
          ? Math.round(((statusMap.done ?? 0) / row._count.id) * 100)
          : 0,
        sourceApps:  appCounts.map(a => ({ app: a.sourceApp, count: a._count.id })),
        lastEventAt: last?.createdAt ?? null,
        lastApp:     last?.sourceApp ?? null,
        lastEvent:   last?.eventType ?? null,
      };
    }),
  );

  return res.json(workflows);
});

// ── GET /api/n8n/workflows/:workflowId ───────────────────────────────────────
// Detailed breakdown: event types, steps, apps, timeline.

router.get("/workflows/:workflowId", async (req: Request, res: Response) => {
  const workspaceId = await resolveWorkspace(req);
  if (!workspaceId) return res.status(401).json({ error: "Invalid API key" });

  const { workflowId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  const [eventTypeCounts, stepCounts, appCounts, recentEvents, statusCounts] =
    await Promise.all([
      // Event type breakdown
      prisma.n8nQueuedEvent.groupBy({
        by:      ["eventType"],
        where:   { workspaceId, workflowId },
        _count:  { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      // Step breakdown
      prisma.n8nQueuedEvent.groupBy({
        by:      ["stepId"],
        where:   { workspaceId, workflowId, stepId: { not: null } },
        _count:  { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      // Source app breakdown
      prisma.n8nQueuedEvent.groupBy({
        by:      ["sourceApp"],
        where:   { workspaceId, workflowId },
        _count:  { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      // Recent events (last N)
      prisma.n8nQueuedEvent.findMany({
        where:   { workspaceId, workflowId },
        orderBy: { createdAt: "desc" },
        take:    limit,
        select: {
          id: true, stepId: true, sourceApp: true, externalId: true,
          eventType: true, status: true, attempts: true,
          lastError: true, createdAt: true, processedAt: true,
        },
      }),
      // Status summary
      prisma.n8nQueuedEvent.groupBy({
        by:     ["status"],
        where:  { workspaceId, workflowId },
        _count: { id: true },
      }),
    ]);

  const statusMap = Object.fromEntries(
    statusCounts.map(s => [s.status, s._count.id])
  );
  const total = statusCounts.reduce((s, r) => s + r._count.id, 0);

  return res.json({
    workflowId,
    summary: {
      total,
      done:        statusMap.done        ?? 0,
      pending:     statusMap.pending     ?? 0,
      processing:  statusMap.processing  ?? 0,
      failed:      statusMap.failed      ?? 0,
      successRate: total > 0 ? Math.round(((statusMap.done ?? 0) / total) * 100) : 0,
    },
    byEventType: eventTypeCounts.map(r => ({ eventType: r.eventType, count: r._count.id })),
    byStep:      stepCounts.map(r => ({ stepId: r.stepId, count: r._count.id })),
    byApp:       appCounts.map(r => ({ sourceApp: r.sourceApp, count: r._count.id })),
    recentEvents,
  });
});

// ── GET /api/n8n/queue/stats ──────────────────────────────────────────────────
// Live queue depth — useful for monitoring and the iqpipe Settings panel.

router.get("/queue/stats", async (req: Request, res: Response) => {
  const workspaceId = await resolveWorkspace(req);
  if (!workspaceId) return res.status(401).json({ error: "Invalid API key" });

  const counts = await prisma.n8nQueuedEvent.groupBy({
    by:     ["status"],
    where:  { workspaceId },
    _count: { id: true },
  });

  const map = Object.fromEntries(counts.map(c => [c.status, c._count.id]));

  return res.json({
    pending:    map.pending    ?? 0,
    processing: map.processing ?? 0,
    done:       map.done       ?? 0,
    failed:     map.failed     ?? 0,
    total:      counts.reduce((s, c) => s + c._count.id, 0),
  });
});

export default router;
