-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "companyName" TEXT,
    "primaryDomain" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Prague',
    "industry" TEXT NOT NULL DEFAULT 'SaaS',
    "plan" TEXT NOT NULL DEFAULT 'pro',
    "seatsTotal" INTEGER NOT NULL DEFAULT 5,
    "seatsUsed" INTEGER NOT NULL DEFAULT 1,
    "billingEmail" TEXT,
    "revenuelaIdPrefix" TEXT NOT NULL DEFAULT 'RVN-LEAD-',
    "publicApiKey" TEXT NOT NULL DEFAULT '',
    "webhookEndpoint" TEXT NOT NULL DEFAULT '',
    "dataAnonymization" BOOLEAN NOT NULL DEFAULT false,
    "dataRetentionMonths" INTEGER NOT NULL DEFAULT 12,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Workspace" ("createdAt", "id", "name", "slug", "updatedAt") SELECT "createdAt", "id", "name", "slug", "updatedAt" FROM "Workspace";
DROP TABLE "Workspace";
ALTER TABLE "new_Workspace" RENAME TO "Workspace";
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");
CREATE TABLE "new_WorkspaceUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "isBillingOwner" BOOLEAN NOT NULL DEFAULT false,
    "darkMode" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "performanceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkspaceUser_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkspaceUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WorkspaceUser" ("createdAt", "id", "role", "updatedAt", "userId", "workspaceId") SELECT "createdAt", "id", "role", "updatedAt", "userId", "workspaceId" FROM "WorkspaceUser";
DROP TABLE "WorkspaceUser";
ALTER TABLE "new_WorkspaceUser" RENAME TO "WorkspaceUser";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
