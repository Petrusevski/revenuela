import { Router, Request, Response } from "express";
import { prisma } from "../db";
import { v4 as uuidv4 } from "uuid";
import { fetchSheetData } from "../services/googleSheets";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";

const router = Router();

// Configure Multer for CSV Uploads (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

// ── 1. GET ALL LEADS ─────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  const workspaceId = String(req.query.workspaceId || "");
  if (!workspaceId) return res.status(400).json({ error: "workspaceId is required" });

  try {
    const leads = await prisma.lead.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      include: { contact: true, account: true }, // Fetch relations if they exist
      take: 500,
    });

    const apiLeads = leads.map((lead) => {
      const contact = lead.contact;
      const account = lead.account;

      // Smart Name Logic: Prefer 'fullName' (Import), fallback to Contact relation (Manual)
      const name = lead.fullName || 
                   (contact ? `${contact.firstName} ${contact.lastName}`.trim() : "") || 
                   lead.email || 
                   "Unnamed Lead";

      // Smart Company Logic
      const company = lead.company || account?.name || "";

      // Smart Title Logic
      const title = lead.title || contact?.jobTitle || "";

      return {
        id: lead.id,
        name: name,
        title: title,
        company: company,
        source: lead.source || "Unknown",
        score: lead.fitScore ?? lead.leadScore ?? 0,
        owner: "Unassigned", // Can be mapped to lead.ownerId if you add User relation later
        status: lead.status,
        journeySteps: lead.journeySteps ? JSON.parse(lead.journeySteps) : null,
        email: lead.email, // Useful for frontend
      };
    });

    return res.json({ leads: apiLeads });
  } catch (err) {
    console.error("Error loading leads:", err);
    return res.status(500).json({ error: "Failed to load leads" });
  }
});

// ── 2. CREATE LEAD (MANUAL) ──────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  const { workspaceId, firstName, lastName, email, company, title } = req.body;

  if (!workspaceId || !email) {
    return res.status(400).json({ error: "Workspace ID and Email are required" });
  }

  try {
    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || email;

    // A. Check/Create Contact (Maintain CRM consistency)
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

    // B. Check/Create Account
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

    // C. Generate Custom ID (e.g., "RVN-A1B2")
    const customId = `RVN-${uuidv4().split("-")[0].toUpperCase()}`;

    // D. Create Lead (Populating BOTH relations and flat fields)
    const lead = await prisma.lead.create({
      data: {
        id: customId,
        workspaceId,
        email, // ✅ Mandatory flat field
        fullName, // ✅ Flat field for display speed
        firstName,
        lastName,
        company,
        title,
        contactId: contact.id, // ✅ Relation
        accountId: accountId,  // ✅ Relation
        source: "Manual",
        status: "new"
      }
    });

    return res.json({ success: true, lead });

  } catch (error) {
    console.error("Create lead error:", error);
    return res.status(500).json({ error: "Failed to create lead" });
  }
});

// ── 3. CSV UPLOAD ────────────────────────────────────────────────────────────
router.post("/upload-csv", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  const { workspaceId } = req.body;
  if (!workspaceId) return res.status(400).json({ error: "Missing workspaceId" });

  const results: any[] = [];
  const stream = Readable.from(req.file.buffer.toString());

  stream
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      let successCount = 0;
      
      for (const row of results) {
        // Flexible Column Mapping
        const email = row["Email"] || row["email"] || row["E-mail"];
        if (!email) continue; // Skip invalid rows

        const firstName = row["First Name"] || row["firstName"] || "";
        const lastName = row["Last Name"] || row["lastName"] || "";
        const company = row["Company"] || row["company"] || row["Account"] || "";
        const title = row["Title"] || row["title"] || row["Job Title"] || "";
        const fullName = `${firstName} ${lastName}`.trim() || email;

        // Custom ID for imports
        const customId = `RVN-${uuidv4().split("-")[0].toUpperCase()}`;

        try {
          await prisma.lead.create({
            data: {
              id: customId,
              workspaceId,
              email,
              fullName,
              firstName,
              lastName,
              company,
              title,
              source: "CSV Import",
              status: "new"
              // Note: We skip creating Contact/Account relations here for bulk speed
            }
          });
          successCount++;
        } catch (e) {
          // console.warn(`Duplicate skipped: ${email}`);
        }
      }

      return res.json({ success: true, count: successCount });
    });
});

// ── 4. GOOGLE SHEETS SYNC ────────────────────────────────────────────────────
router.post("/sync-gsheet", async (req: Request, res: Response) => {
  try {
    const { workspaceId, sheetUrl } = req.body;
    if (!sheetUrl) return res.status(400).json({ error: "Missing sheetUrl" });

    const rawLeads = await fetchSheetData(sheetUrl);
    if (rawLeads.length === 0) return res.status(400).json({ error: "Sheet is empty." });

    let successCount = 0;
    
    for (const row of rawLeads) {
      if (!row.email) continue;
      const fullName = row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim();
      const customId = `RVN-${uuidv4().split("-")[0].toUpperCase()}`;

      try {
        await prisma.lead.create({
          data: {
            id: customId,
            workspaceId,
            email: row.email,
            fullName: fullName || "Unknown",
            company: row.company || "",
            title: row.title || "",
            source: "Google Sheets",
            status: "new"
          }
        });
        successCount++;
      } catch (e) { /* skip duplicate */ }
    }

    return res.json({ success: true, count: successCount });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

// ── 5. UPDATE JOURNEY ────────────────────────────────────────────────────────
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