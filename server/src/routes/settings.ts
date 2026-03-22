// server/src/routes/settings.ts

import { Router } from "express";
import { prisma } from "../db";
import crypto from "crypto";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";


const router = Router();
router.use(requireAuth);

/**
 * For now: simple current-user resolver.
 * Replace with real auth (e.g. req.user.id) when ready.
 */
function getCurrentUserId(req: AuthenticatedRequest): string {
  // requireAuth guarantees req.user exists
  return req.user!.id;
}

/**
 * Get the membership + workspace for the current user.
 * For MVP we just take the first workspace membership.
 * Later you can pass workspaceId from the frontend.
 */
async function getCurrentMembership(req: AuthenticatedRequest) {
  const userId = getCurrentUserId(req);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found.");
  }

  let membership = await prisma.workspaceUser.findFirst({
    where: { userId },
    include: { workspace: true },
  });

  // If no workspace exists yet, create one and membership
  if (!membership) {
    const workspace = await prisma.workspace.create({
      data: {
        name: `${user.fullName || "Untitled"} workspace`,
        slug: `ws-${userId}`,
        companyName: null,
        primaryDomain: null,
        plan: "trial",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        publicApiKey: `rvn_pk_${crypto.randomBytes(12).toString("hex")}`,
        webhookEndpoint: `https://api.revenuela.com/webhooks/${userId}`,
      },
    });

    membership = await prisma.workspaceUser.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: "owner",
        isBillingOwner: true,
      },
      include: { workspace: true },
    });
  }

  return membership;
}


/**
 * GET /api/settings
 * Returns workspace + membership-level settings for the current user.
 */
// Valid plan IDs that correspond to real pricing tiers
const VALID_PLANS = new Set(["trial", "starter", "growth", "scale"]);

router.get("/", async (req, res) => {
  try {
    const membership = await getCurrentMembership(req);
    const { workspace, ...membershipFields } = membership;

    // Normalize legacy "pro" (and any unknown) plan → "trial" and persist the fix
    let plan = workspace.plan;
    if (!VALID_PLANS.has(plan)) {
      plan = "trial";
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          plan: "trial",
          trialEndsAt: workspace.trialEndsAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Fetch the user's full name to include in membership
    const user = await prisma.user.findUnique({
      where: { id: membershipFields.userId },
      select: { fullName: true, email: true },
    });

    const workspaceSettings = {
      id: workspace.id,
      workspaceName: workspace.name,
      companyName: workspace.companyName,
      primaryDomain: workspace.primaryDomain,
      defaultCurrency: workspace.defaultCurrency,
      timezone: workspace.timezone,
      industry: workspace.industry,
      plan,
      trialEndsAt: workspace.trialEndsAt?.toISOString() ?? null,
      createdAt: workspace.createdAt.toISOString(),
      seatsTotal: workspace.seatsTotal,
      seatsUsed: workspace.seatsUsed,
      billingEmail: workspace.billingEmail,
      revenuelaIdPrefix: workspace.revenuelaIdPrefix,
      publicApiKey: workspace.publicApiKey,
      webhookEndpoint: workspace.webhookEndpoint,
      dataAnonymization: workspace.dataAnonymization,
      dataRetentionMonths: workspace.dataRetentionMonths,
    };

    const membershipSettings = {
      id: membershipFields.id,
      role: membershipFields.role,
      isBillingOwner: membershipFields.isBillingOwner,
      darkMode: membershipFields.darkMode,
      weeklyDigest: membershipFields.weeklyDigest,
      performanceAlerts: membershipFields.performanceAlerts,
      userFullName: user?.fullName ?? "—",
      userEmail: user?.email ?? "—",
    };

    return res.json({
      workspace: workspaceSettings,
      membership: membershipSettings,
    });
  } catch (err: any) {
    console.error("GET /api/settings error", err);
    return res.status(500).json({
      error: "Failed to load settings",
      details: err?.message || "Unknown error",
    });
  }
});

/**
 * Allowed fields to update for each section
 */
const WORKSPACE_UPDATABLE_FIELDS = [
  "workspaceName",
  "companyName",
  "primaryDomain",
  "defaultCurrency",
  "timezone",
  "industry",
  "plan",
  "seatsTotal",
  "seatsUsed",
  "billingEmail",
  "revenuelaIdPrefix",
  "publicApiKey",
  "webhookEndpoint",
  "dataAnonymization",
  "dataRetentionMonths",
] as const;

const MEMBERSHIP_UPDATABLE_FIELDS = [
  "role",
  "isBillingOwner",
  "darkMode",
  "weeklyDigest",
  "performanceAlerts",
] as const;

type WorkspaceUpdateField = (typeof WORKSPACE_UPDATABLE_FIELDS)[number];
type MembershipUpdateField = (typeof MEMBERSHIP_UPDATABLE_FIELDS)[number];

/**
 * PUT /api/settings
 * Body:
 * {
 *   workspace?: { ...workspace settings subset... },
 *   membership?: { ...membership settings subset... }
 * }
 */
router.put("/", async (req, res) => {
  try {
    const membership = await getCurrentMembership(req);
    const { workspace, membership: membershipPayload } = req.body || {};

    let updatedWorkspace = membership.workspace;
    let updatedMembership = membership;

    // --- Update workspace-level settings ---
    if (workspace && typeof workspace === "object") {
      const workspaceData: Partial<Record<WorkspaceUpdateField, any>> = {};
      WORKSPACE_UPDATABLE_FIELDS.forEach((field) => {
        if (field in workspace) {
          if (field === "workspaceName") {
            // map to actual column 'name' in Prisma
            (workspaceData as any)["name"] = workspace[field];
          } else {
            (workspaceData as any)[field] =
              workspace[field as WorkspaceUpdateField];
          }
        }
      });

      if (Object.keys(workspaceData).length > 0) {
        updatedWorkspace = await prisma.workspace.update({
          where: { id: membership.workspaceId },
          data: workspaceData,
        });
      }
    }

    // --- Update membership (user profile in workspace) ---
    if (membershipPayload && typeof membershipPayload === "object") {
      const membershipData: Partial<Record<MembershipUpdateField, any>> = {};
      MEMBERSHIP_UPDATABLE_FIELDS.forEach((field) => {
        if (field in membershipPayload) {
          (membershipData as any)[field] =
            membershipPayload[field as MembershipUpdateField];
        }
      });

      if (Object.keys(membershipData).length > 0) {
        updatedMembership = await prisma.workspaceUser.update({
          where: { id: membership.id },
          data: membershipData,
          include: { workspace: true },
        });
      }
    }

    // Normalize plan on PUT response too
    const putPlan = VALID_PLANS.has(updatedWorkspace.plan) ? updatedWorkspace.plan : "trial";

    // Fetch user name for membership response
    const putUser = await prisma.user.findUnique({
      where: { id: membership.userId },
      select: { fullName: true, email: true },
    });

    return res.json({
      workspace: {
        id: updatedWorkspace.id,
        workspaceName: updatedWorkspace.name,
        companyName: updatedWorkspace.companyName,
        primaryDomain: updatedWorkspace.primaryDomain,
        defaultCurrency: updatedWorkspace.defaultCurrency,
        timezone: updatedWorkspace.timezone,
        industry: updatedWorkspace.industry,
        plan: putPlan,
        trialEndsAt: (updatedWorkspace as any).trialEndsAt ? new Date((updatedWorkspace as any).trialEndsAt).toISOString() : null,
        createdAt: updatedWorkspace.createdAt.toISOString(),
        seatsTotal: updatedWorkspace.seatsTotal,
        seatsUsed: updatedWorkspace.seatsUsed,
        billingEmail: updatedWorkspace.billingEmail,
        revenuelaIdPrefix: updatedWorkspace.revenuelaIdPrefix,
        publicApiKey: updatedWorkspace.publicApiKey,
        webhookEndpoint: updatedWorkspace.webhookEndpoint,
        dataAnonymization: updatedWorkspace.dataAnonymization,
        dataRetentionMonths: updatedWorkspace.dataRetentionMonths,
      },
      membership: {
        id: updatedMembership.id,
        role: updatedMembership.role,
        isBillingOwner: updatedMembership.isBillingOwner,
        darkMode: updatedMembership.darkMode,
        weeklyDigest: updatedMembership.weeklyDigest,
        performanceAlerts: updatedMembership.performanceAlerts,
        userFullName: putUser?.fullName ?? "—",
        userEmail: putUser?.email ?? "—",
      },
    });
  } catch (err: any) {
    console.error("PUT /api/settings error", err);
    return res.status(500).json({
      error: "Failed to update settings",
      details: err?.message || "Unknown error",
    });
  }
});

export default router;
