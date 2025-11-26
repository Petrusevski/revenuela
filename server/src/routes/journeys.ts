import { Router, Request, Response } from "express";
import { prisma } from "../db";

const router = Router();

const WON_KEYWORDS = ["won", "closed_won", "customer"];
const LOST_KEYWORDS = ["lost", "closed_lost", "churn", "disqualified"];

function inferStatusFromDeal(deal: { stage: string | null; closedAt: Date | null }): "won" | "pipeline" | "lost" {
  const stage = (deal.stage || "").toLowerCase();
  if (deal.closedAt) {
    if (WON_KEYWORDS.some((k) => stage.includes(k))) return "won";
    if (LOST_KEYWORDS.some((k) => stage.includes(k))) return "lost";
  }
  return "pipeline";
}

router.get("/", async (req: Request, res: Response) => {
  const workspaceId = String(req.query.workspaceId || "");

  if (!workspaceId) {
    return res.status(400).json({ error: "workspaceId is required" });
  }

  try {
    // 1. Fetch leads that have EITHER manual journey steps OR sequence activity
    const leads = await prisma.lead.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        account: true,
        contact: true,
        sequenceEnrollments: {
          include: { sequence: true },
        },
      },
    });

    if (!leads.length) {
      return res.json({ journeys: [] });
    }

    // 2. Fetch related deals for context
    const accountIds = leads.map((l) => l.accountId).filter(Boolean) as string[];
    const contactIds = leads.map((l) => l.contactId).filter(Boolean) as string[];

    const deals = await prisma.deal.findMany({
      where: {
        workspaceId,
        OR: [
          accountIds.length ? { accountId: { in: accountIds } } : undefined,
          contactIds.length ? { primaryContactId: { in: contactIds } } : undefined,
        ].filter(Boolean) as any,
      },
      orderBy: { updatedAt: "desc" },
    });

    const dealsByAccountId = new Map();
    const dealsByContactId = new Map();

    for (const d of deals) {
      if (d.accountId) {
        if (!dealsByAccountId.has(d.accountId)) dealsByAccountId.set(d.accountId, []);
        dealsByAccountId.get(d.accountId).push(d);
      }
      if (d.primaryContactId) {
        if (!dealsByContactId.has(d.primaryContactId)) dealsByContactId.set(d.primaryContactId, []);
        dealsByContactId.get(d.primaryContactId).push(d);
      }
    }

    // 3. Build Journeys
    const journeys = leads.map((lead) => {
      // ✅ FIXED: Updated leadSource -> source
      const source = lead.source || "Unknown";
      
      // Determine Status & Revenue
      const relatedDeals = [
        ...(lead.accountId ? dealsByAccountId.get(lead.accountId) || [] : []),
        ...(lead.contactId ? dealsByContactId.get(lead.contactId) || [] : [])
      ];

      let status: "won" | "pipeline" | "lost" = "pipeline";
      let mrr: string | undefined = undefined;

      if (relatedDeals.length) {
        const latest = relatedDeals.reduce((a: any, b: any) => a.updatedAt > b.updatedAt ? a : b);
        status = inferStatusFromDeal(latest);
        if (latest.amount != null) {
          mrr = `€${latest.amount}`;
        }
      } else {
        // If manual status is set on lead
        if (lead.status === 'won') status = 'won';
        if (lead.status === 'lost') status = 'lost';
      }

      // Determine Steps
      let steps: string[] = [];

      // PRIORITY 1: Use Manually Saved Steps (The ones you selected in the modal)
      if (lead.journeySteps) {
        try {
          const parsed = JSON.parse(lead.journeySteps);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Add Source to start if not present
            if (parsed[0] !== source && source !== 'Unknown') {
               steps = [source, ...parsed];
            } else {
               steps = parsed;
            }
          }
        } catch (e) {
          console.error("Failed to parse journey steps", e);
        }
      }

      // PRIORITY 2: Infer from Activity (if no manual steps)
      if (steps.length === 0) {
        steps.push(source);
        if (lead.sequenceEnrollments[0]?.sequence?.name) {
          steps.push("Outbound");
        }
        if (relatedDeals.length > 0) {
          steps.push("CRM");
          if (status === 'won') steps.push("Stripe");
        }
      }

      // Determine Outbound Label
      // If steps are ["Clay", "HeyReach", "CRM"], outbound is "HeyReach"
      const outbound = steps.length > 1 ? steps[1] : "Pending";

      return {
        id: lead.id, // RVN-ID
        source,
        outbound,
        status,
        mrr,
        steps,
      };
    });

    // Only return journeys that have at least 1 step (valid data)
    const validJourneys = journeys.filter(j => j.steps.length > 0);

    return res.json({ journeys: validJourneys });
  } catch (err) {
    console.error("Error loading journeys:", err);
    return res.status(500).json({ error: "Failed to load journeys" });
  }
});

export default router;