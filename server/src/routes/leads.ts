import { Router, Request, Response } from "express";
import { prisma } from "../db";
import { v4 as uuidv4 } from "uuid";
import { fetchSheetData } from "../services/googleSheets";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ── HELPER: Process & Upsert Leads ───────────────────────────────────────────
async function processSheetLeads(workspaceId: string, rawLeads: any[]) {
  let count = 0;
  for (const row of rawLeads) {
    if (!row.email) continue;
    
    const fullName = row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim();
    // Check if lead exists to preserve ID, otherwise gen new one
    const existing = await prisma.lead.findFirst({ where: { workspaceId, email: row.email }});
    const customId = existing?.id || `RVN-${uuidv4().split("-")[0].toUpperCase()}`;

    // UPSERT: Updates existing leads (new columns) or creates new ones
    await prisma.lead.upsert({
      where: { 
        // We need a unique constraint. If your schema doesn't have @@unique([workspaceId, email]),
        // we use the ID if found, or a fallback unique lookup.
        // Ideally, schema should have: @@unique([workspaceId, email])
        id: customId 
      },
      update: {
        fullName: fullName || undefined,
        company: row.company || undefined,
        title: row.title || undefined,
        // Add other fields here if you map them in googleSheets.ts (e.g. phone)
      },
      create: {
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
    count++;
  }
  return count;
}

// ── ROUTES ───────────────────────────────────────────────────────────────────

// 1. GET ALL LEADS
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
      const name = lead.fullName || (contact ? `${contact.firstName} ${contact.lastName}`.trim() : "") || lead.email || "Unnamed Lead";
      const company = lead.company || account?.name || "";
      const title = lead.title || contact?.jobTitle || "";

      return {
        id: lead.id,
        name: name,
        title: title,
        company: company,
        source: lead.source || "Unknown",
        score: lead.fitScore ?? lead.leadScore ?? 0,
        owner: "Unassigned",
        status: lead.status,
        journeySteps: lead.journeySteps ? JSON.parse(lead.journeySteps) : null,
        email: lead.email,
      };
    });

    return res.json({ leads: apiLeads });
  } catch (err) {
    console.error("Error loading leads:", err);
    return res.status(500).json({ error: "Failed to load leads" });
  }
});

// 2. CREATE LEAD (MANUAL)
router.post("/", async (req: Request, res: Response) => {
  const { workspaceId, firstName, lastName, email, company, title } = req.body;
  if (!workspaceId || !email) return res.status(400).json({ error: "Required fields missing" });

  try {
    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || email;
    const customId = `RVN-${uuidv4().split("-")[0].toUpperCase()}`;

    const lead = await prisma.lead.create({
      data: {
        id: customId,
        workspaceId,
        email,
        fullName,
        firstName,
        lastName,
        company,
        title,
        source: "Manual",
        status: "new"
      }
    });
    return res.json({ success: true, lead });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create lead" });
  }
});

// 3. SYNC GSHEET (Initial Setup)
router.post("/sync-gsheet", async (req: Request, res: Response) => {
  try {
    const { workspaceId, sheetUrl } = req.body;
    if (!sheetUrl) return res.status(400).json({ error: "Missing sheetUrl" });

    const rawLeads = await fetchSheetData(sheetUrl);
    if (rawLeads.length === 0) return res.status(400).json({ error: "Sheet is empty." });

    // A. Process Data
    const count = await processSheetLeads(workspaceId, rawLeads);

    // B. SAVE CONNECTION (So we can refresh later)
    await prisma.integrationConnection.upsert({
      where: { 
        // Assuming you might want 1 sheet per workspace for now, or add a unique constraint in schema on [workspaceId, provider]
        // For now, we find first or create. Ideally schema needs @@unique([workspaceId, provider])
        id: `gsheet-${workspaceId}` // Synthetic ID or rely on findFirst logic below if schema differs
      },
      update: {
        authData: JSON.stringify({ sheetUrl }),
        status: "connected",
        updatedAt: new Date()
      },
      create: {
        id: `gsheet-${workspaceId}`, // Ensure ID fits your schema type (CUID usually required, so let's use findFirst logic instead if this fails)
        workspaceId,
        provider: "google_sheets",
        status: "connected",
        authData: JSON.stringify({ sheetUrl })
      }
    });

    return res.json({ success: true, count });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

// 4. REFRESH SYNC (The New Button)
router.post("/sync-refresh", async (req: Request, res: Response) => {
  const { workspaceId } = req.body;
  if (!workspaceId) return res.status(400).json({ error: "Missing workspaceId" });

  try {
    // 1. Find the saved connection
    const conn = await prisma.integrationConnection.findFirst({
      where: { workspaceId, provider: "google_sheets" }
    });

    if (!conn || !conn.authData) {
      return res.status(404).json({ error: "No Google Sheet connected yet." });
    }

    // 2. Get URL
    const { sheetUrl } = JSON.parse(conn.authData);
    if (!sheetUrl) return res.status(400).json({ error: "Saved connection missing URL." });

    // 3. Fetch & Process
    const rawLeads = await fetchSheetData(sheetUrl);
    const count = await processSheetLeads(workspaceId, rawLeads);

    // 4. Update timestamp
    await prisma.integrationConnection.update({
      where: { id: conn.id },
      data: { updatedAt: new Date() }
    });

    return res.json({ success: true, count, message: `Synced ${count} rows from Google Sheet.` });

  } catch (error: any) {
    console.error("Refresh failed:", error);
    return res.status(500).json({ error: "Failed to refresh sheet. " + error.message });
  }
});

// 5. UPLOAD CSV
router.post("/upload-csv", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file || !req.body.workspaceId) return res.status(400).json({ error: "Missing file or workspaceId" });
  const { workspaceId } = req.body;
  const results: any[] = [];
  
  Readable.from(req.file.buffer.toString())
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      let count = 0;
      for (const row of results) {
        const email = row["Email"] || row["email"];
        if (!email) continue;
        
        const fullName = `${row["First Name"]||''} ${row["Last Name"]||''}`.trim() || email;
        const customId = `RVN-${uuidv4().split("-")[0].toUpperCase()}`;

        // Simple create for CSV (ignores duplicates)
        try {
          await prisma.lead.create({
            data: {
              id: customId, workspaceId, email, fullName,
              firstName: row["First Name"], lastName: row["Last Name"],
              company: row["Company"], title: row["Title"],
              source: "CSV Import", status: "new"
            }
          });
          count++;
        } catch (e) {}
      }
      return res.json({ success: true, count });
    });
});

// 6. UPDATE JOURNEY
router.patch("/:id/journey", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { steps } = req.body; 
  try {
    const updated = await prisma.lead.update({
      where: { id },
      data: { journeySteps: JSON.stringify(steps), status: "active" }
    });
    return res.json({ success: true, leadId: updated.id });
  } catch (error) {
    return res.status(500).json({ error: "Failed to save journey" });
  }
});

export default router;