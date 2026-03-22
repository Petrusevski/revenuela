import { Router, Request, Response } from "express";
import { prisma } from "../db";

const router = Router();

// ── Issuer (fixed) ────────────────────────────────────────────────────────────
export const ISSUER = {
  company:      "VIBECRAB OÜ",
  registry:     "17289453",
  address:      "Harju maakond, Tallinn, Lasnamäe linnaosa, Sepapaja tn 6, 15551",
  email:        "billing@iqpipe.io",
  country:      "Estonia",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function invoiceNumber(year: number, seq: number): string {
  return `IQP-${year}-${String(seq).padStart(4, "0")}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

// ── GET /api/invoices?workspaceId=... ─────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  const workspaceId = String(req.query.workspaceId || "");
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });

  try {
    // Pull all Stripe payment activities (deal_won with body containing source:Stripe)
    const activities = await prisma.activity.findMany({
      where: { workspaceId, type: "deal_won" },
      orderBy: { createdAt: "asc" },
      include: {
        lead: {
          select: { id: true, fullName: true, email: true, company: true },
        },
      },
    });

    const invoices = activities
      .map((a, idx) => {
        let body: Record<string, string> = {};
        try { body = JSON.parse(a.body || "{}"); } catch {}

        // Only include Stripe-sourced payments (have amount field)
        if (!body.amount && !body.source) return null;

        const createdAt = new Date(a.createdAt);
        const year      = createdAt.getFullYear();

        return {
          id:            a.id,
          invoiceNumber: invoiceNumber(year, idx + 1),
          date:          createdAt.toISOString(),
          dateFormatted: formatDate(createdAt),
          status:        "paid",
          // Customer
          customerName:  a.lead?.fullName  || a.subject || "Unknown Customer",
          customerEmail: a.lead?.email     || "",
          customerCompany: a.lead?.company || "",
          leadId:        a.lead?.id        || null,
          // Line item
          description:   body.description  || "iqpipe subscription",
          amount:        parseFloat(body.amount || "0"),
          currency:      (body.currency || "EUR").toUpperCase(),
          source:        body.source || "Stripe",
          chargeId:      a.subject || "",
          // Issuer
          issuer:        ISSUER,
        };
      })
      .filter(Boolean);

    return res.json({ invoices });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to load invoices: " + err.message });
  }
});

export default router;
