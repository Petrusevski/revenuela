import { Router, Request, Response } from "express";
import axios from "axios";
import { prisma } from "../db";
import { decrypt } from "../utils/encryption";

const router = Router();

function parseExperiment(e: any) {
  return {
    ...e,
    kpis: e.kpis ? JSON.parse(e.kpis) : [],
    stackA: e.stackA ? JSON.parse(e.stackA) : null,
    stackB: e.stackB ? JSON.parse(e.stackB) : null,
    metricsA: e.metricsA ? JSON.parse(e.metricsA) : null,
    metricsB: e.metricsB ? JSON.parse(e.metricsB) : null,
    leadAssignment: e.leadAssignment ? JSON.parse(e.leadAssignment) : null,
  };
}

// GET /api/experiments?workspaceId=...
router.get("/", async (req: Request, res: Response) => {
  const workspaceId = String(req.query.workspaceId || "");
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });

  try {
    const experiments = await prisma.experiment.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    return res.json(experiments.map(parseExperiment));
  } catch (err) {
    console.error("Error loading experiments:", err);
    return res.status(500).json({ error: "Failed to load experiments" });
  }
});

// POST /api/experiments
router.post("/", async (req: Request, res: Response) => {
  const {
    workspaceId, name, status, startDate, endDate,
    audienceSize, splitPct, kpis, stackA, stackB,
    metricsA, metricsB, winner, leadAssignment,
  } = req.body;

  if (!workspaceId || !name) {
    return res.status(400).json({ error: "workspaceId and name required" });
  }

  try {
    const experiment = await prisma.experiment.create({
      data: {
        workspaceId,
        name,
        status: status || "draft",
        startDate: startDate || null,
        endDate: endDate || null,
        audienceSize: audienceSize || 0,
        splitPct: splitPct || 50,
        kpis: kpis ? JSON.stringify(kpis) : null,
        stackA: stackA ? JSON.stringify(stackA) : null,
        stackB: stackB ? JSON.stringify(stackB) : null,
        metricsA: metricsA ? JSON.stringify(metricsA) : null,
        metricsB: metricsB ? JSON.stringify(metricsB) : null,
        winner: winner || null,
        leadAssignment: leadAssignment ? JSON.stringify(leadAssignment) : null,
      },
    });
    return res.status(201).json(parseExperiment(experiment));
  } catch (err) {
    console.error("Error creating experiment:", err);
    return res.status(500).json({ error: "Failed to create experiment" });
  }
});

// PUT /api/experiments/:id
router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name, status, endDate, audienceSize, splitPct,
    kpis, stackA, stackB, metricsA, metricsB, winner, leadAssignment,
  } = req.body;

  const data: Record<string, any> = {};
  if (name !== undefined) data.name = name;
  if (status !== undefined) data.status = status;
  if (endDate !== undefined) data.endDate = endDate;
  if (audienceSize !== undefined) data.audienceSize = audienceSize;
  if (splitPct !== undefined) data.splitPct = splitPct;
  if (kpis !== undefined) data.kpis = JSON.stringify(kpis);
  if (stackA !== undefined) data.stackA = JSON.stringify(stackA);
  if (stackB !== undefined) data.stackB = JSON.stringify(stackB);
  if (metricsA !== undefined) data.metricsA = JSON.stringify(metricsA);
  if (metricsB !== undefined) data.metricsB = JSON.stringify(metricsB);
  if (winner !== undefined) data.winner = winner;
  if (leadAssignment !== undefined) data.leadAssignment = JSON.stringify(leadAssignment);

  try {
    const experiment = await prisma.experiment.update({ where: { id }, data });
    return res.json(parseExperiment(experiment));
  } catch (err) {
    console.error("Error updating experiment:", err);
    return res.status(500).json({ error: "Failed to update experiment" });
  }
});

// POST /api/experiments/:id/push
// Pushes A/B variant assignments to connected CRM and outreach tools.
// Each lead in leadAssignment gets tagged in HubSpot/Pipedrive with their variant.
router.post("/:id/push", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { workspaceId } = req.body;
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });

  try {
    const experiment = await prisma.experiment.findUnique({ where: { id } });
    if (!experiment) return res.status(404).json({ error: "Experiment not found" });

    // leadAssignment is stored as { A: string[], B: string[] }
    const raw: { A?: string[]; B?: string[] } = experiment.leadAssignment
      ? JSON.parse(experiment.leadAssignment as string)
      : {};

    // Convert to per-lead map { leadId: "A" | "B" }
    const assignment: Record<string, "A" | "B"> = {};
    for (const id of (raw.A ?? [])) assignment[id] = "A";
    for (const id of (raw.B ?? [])) assignment[id] = "B";

    const leadIds = Object.keys(assignment);
    if (!leadIds.length) return res.json({ pushed: 0, results: [] });

    // Fetch all relevant leads with their contacts
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds }, workspaceId },
      include: { contact: true },
    });

    // Fetch connected tools
    const connections = await prisma.integrationConnection.findMany({
      where: { workspaceId, status: "connected" },
      select: { provider: true, authData: true },
    });
    const connMap: Record<string, string | null> = {};
    for (const c of connections) connMap[c.provider] = c.authData ?? null;

    function parseAuth(raw: string | null) {
      if (!raw) return null;
      try { return JSON.parse(decrypt(raw)); } catch { return null; }
    }

    const results: Array<{ leadId: string; variant: string; tool: string; success: boolean }> = [];

    for (const lead of leads) {
      const variant = assignment[lead.id];
      if (!variant) continue;

      const contactId = lead.contactId || "";
      const variantLabel = variant === "A" ? "Variant A" : "Variant B";

      // ── HubSpot: set ab_test_variant + ab_test_name contact properties ──
      if (connMap["hubspot"] && contactId.startsWith("hubspot-")) {
        const auth = parseAuth(connMap["hubspot"]);
        const token = auth?.accessToken || auth?.apiKey;
        const hubspotId = contactId.replace("hubspot-", "");
        if (token && hubspotId) {
          try {
            await axios.patch(
              `https://api.hubapi.com/crm/v3/objects/contacts/${hubspotId}`,
              { properties: { ab_test_variant: variantLabel, ab_test_name: experiment.name } },
              { headers: { Authorization: `Bearer ${token.trim()}` } },
            );
            results.push({ leadId: lead.id, variant, tool: "hubspot", success: true });
          } catch (err: any) {
            results.push({ leadId: lead.id, variant, tool: "hubspot", success: false });
          }
        }
      }

      // ── Pipedrive: add a note to the person record ──────────────────────
      if (connMap["pipedrive"] && contactId.startsWith("pipedrive-")) {
        const auth = parseAuth(connMap["pipedrive"]);
        const pipedriveId = contactId.replace("pipedrive-", "");
        if (auth?.apiKey && pipedriveId) {
          try {
            await axios.post(
              `https://api.pipedrive.com/v1/notes?api_token=${auth.apiKey.trim()}`,
              {
                content: `A/B Test "${experiment.name}" — assigned to ${variantLabel}`,
                person_id: Number(pipedriveId),
              },
            );
            results.push({ leadId: lead.id, variant, tool: "pipedrive", success: true });
          } catch {
            results.push({ leadId: lead.id, variant, tool: "pipedrive", success: false });
          }
        }
      }

      // ── HeyReach: add lead to campaign from the matching stack ───────────
      if (connMap["heyreach"]) {
        const auth = parseAuth(connMap["heyreach"]);
        const stack = variant === "A"
          ? (experiment.stackA ? JSON.parse(experiment.stackA as string) : null)
          : (experiment.stackB ? JSON.parse(experiment.stackB as string) : null);
        const campaignId = stack?.heyreachCampaignId || stack?.campaignId;
        const linkedInUrl = lead.linkedin || lead.contact?.linkedinUrl || null;

        if (auth?.apiKey && campaignId) {
          try {
            await axios.post(
              `https://api.heyreach.io/api/public/campaign/${campaignId}/lead/add`,
              {
                leads: [{
                  firstName:  lead.firstName || lead.fullName?.split(" ")[0] || "",
                  lastName:   lead.lastName  || lead.fullName?.split(" ").slice(1).join(" ") || "",
                  email:      lead.email     || "",
                  linkedInUrl: linkedInUrl   || "",
                  company:    lead.company   || "",
                  customFields: [{ key: "ab_test_variant", value: variantLabel }],
                }],
              },
              { headers: { "X-API-KEY": auth.apiKey.trim(), "Content-Type": "application/json" } },
            );
            results.push({ leadId: lead.id, variant, tool: "heyreach", success: true });
          } catch (err: any) {
            console.error("[push/heyreach]", err.response?.data || err.message);
            results.push({ leadId: lead.id, variant, tool: "heyreach", success: false });
          }
        }
      }
    }

    return res.json({ pushed: results.filter(r => r.success).length, total: leads.length, results });
  } catch (err: any) {
    console.error("Error pushing experiment:", err);
    return res.status(500).json({ error: "Failed to push experiment" });
  }
});

// DELETE /api/experiments/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.experiment.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err) {
    console.error("Error deleting experiment:", err);
    return res.status(500).json({ error: "Failed to delete experiment" });
  }
});

export default router;
