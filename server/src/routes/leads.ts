import { Router, Request, Response } from "express";
import { prisma } from "../db";
import { v4 as uuidv4 } from "uuid"; // 👈 Import UUID generator

const router = Router();

// GET /api/leads (Existing code...)
router.get("/", async (req: Request, res: Response) => {
  const workspaceId = String(req.query.workspaceId || "");
  if (!workspaceId) return res.status(400).json({ error: "workspaceId is required" });

  try {
    const leads = await prisma.lead.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      include: { contact: true, account: true },
      take: 500,
    });

    const apiLeads = leads.map((lead) => {
      const contact = lead.contact;
      const account = lead.account;
      const fullName = contact && (contact.firstName || contact.lastName)
          ? `${contact.firstName} ${contact.lastName}`.trim()
          : contact?.email || "Unnamed lead";

      return {
        id: lead.id,
        name: fullName,
        title: contact?.jobTitle || "",
        company: account?.name || "",
        source: lead.leadSource || "Unknown",
        score: lead.fitScore ?? lead.leadScore ?? 0,
        owner: "Unassigned",
        status: lead.status,
        journeySteps: lead.journeySteps ? JSON.parse(lead.journeySteps) : null, 
      };
    });

    return res.json({ leads: apiLeads });
  } catch (err) {
    console.error("Error loading leads:", err);
    return res.status(500).json({ error: "Failed to load leads" });
  }
});

// 👇 UPDATED: CREATE LEAD with RVN- ID
router.post("/", async (req: Request, res: Response) => {
  const { workspaceId, firstName, lastName, email, company, title } = req.body;

  if (!workspaceId || !email) {
    return res.status(400).json({ error: "Workspace ID and Email are required" });
  }

  try {
    // 1. Check if contact exists
    let contact = await prisma.contact.findFirst({
      where: { workspaceId, email },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          workspaceId,
          firstName: firstName || "",
          lastName: lastName || "",
          email,
          jobTitle: title || "",
        }
      });
    }

    // 2. Find or Create Account
    let accountId = null;
    if (company) {
      let account = await prisma.account.findFirst({
        where: { workspaceId, name: company }
      });
      if (!account) {
        account = await prisma.account.create({
          data: { workspaceId, name: company }
        });
      }
      accountId = account.id;
    }

    // 3. GENERATE CUSTOM ID
    // Generates something like "RVN-A1B2C3D4"
    const customId = `RVN-${uuidv4().split("-")[0].toUpperCase()}`;

    // 4. Create Lead
    const lead = await prisma.lead.create({
      data: {
        id: customId, // 👈 Force the custom ID here
        workspaceId,
        contactId: contact.id,
        accountId: accountId,
        leadSource: "Manual",
        status: "new"
      }
    });

    return res.json({ success: true, lead });

  } catch (error) {
    console.error("Create lead error:", error);
    return res.status(500).json({ error: "Failed to create lead" });
  }
});

// PATCH Journey (Existing code...)
router.patch("/:id/journey", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { steps } = req.body; 

  if (!Array.isArray(steps)) {
    return res.status(400).json({ error: "Steps must be an array" });
  }

  try {
    const updated = await prisma.lead.update({
      where: { id },
      data: {
        journeySteps: JSON.stringify(steps),
        status: "active" 
      }
    });
    return res.json({ success: true, leadId: updated.id });
  } catch (error) {
    console.error("Failed to save journey:", error);
    return res.status(500).json({ error: "Failed to save journey" });
  }
});

export default router;