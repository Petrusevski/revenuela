// server/src/services/notificationService.ts
import { prisma } from "../db";

export type NotificationSeverity = "info" | "warning" | "error";

interface CreateNotificationParams {
  workspaceId: string;
  userId?: string | null;
  type: string;
  title: string;
  body: string;
  severity?: NotificationSeverity;
}

/**
 * Call this from other parts of the backend
 * whenever something useful happens (workflow, integration, etc.).
 */
export async function createNotification(params: CreateNotificationParams) {
  const { workspaceId, userId, type, title, body, severity } = params;

  return prisma.notification.create({
    data: {
      workspaceId,
      userId: userId ?? null,
      type,
      title,
      body,
      severity: severity ?? "info",
    },
  });
}
