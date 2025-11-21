// server/src/routes/notifications.ts
import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth"; // adjust path if needed

const router = Router();

/**
 * GET /api/notifications
 * Returns latest notifications for the current user's workspace.
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const auth = (req as any).auth || (req as any).user;
    const workspaceId: string | undefined = auth?.workspaceId;
    const userId: string | undefined = auth?.userId;

    if (!workspaceId) {
      return res.status(400).json({ error: "Missing workspaceId in auth payload" });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        workspaceId,
        OR: [
          { userId: null },        // workspace-wide notifications
          { userId: userId || "" } // personal notifications
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    res.json({ notifications });
  } catch (err: any) {
    console.error("Error fetching notifications", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

/**
 * POST /api/notifications/mark-read
 * Body: { ids: string[] } – marks these notifications as read.
 * If ids is empty/omitted, marks all for this user/workspace as read.
 */
router.post("/mark-read", requireAuth, async (req, res) => {
  try {
    const auth = (req as any).auth || (req as any).user;
    const workspaceId: string | undefined = auth?.workspaceId;
    const userId: string | undefined = auth?.userId;
    const { ids } = req.body as { ids?: string[] };

    if (!workspaceId) {
      return res.status(400).json({ error: "Missing workspaceId in auth payload" });
    }

    await prisma.notification.updateMany({
      where: {
        workspaceId,
        ...(ids && ids.length
          ? { id: { in: ids } }
          : {}), // if no ids, mark all for this user/workspace
        OR: [
          { userId: null },
          { userId: userId || "" }
        ]
      },
      data: {
        isRead: true,
        readAt: new Date()
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("Error marking notifications as read", err);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

export default router;
