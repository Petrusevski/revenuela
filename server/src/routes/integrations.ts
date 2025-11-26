import { Router, Request, Response } from "express";
import { prisma } from "../db";
import axios from "axios";
import Stripe from "stripe";
import { decrypt } from "../utils/encryption"; 
import * as heyReachService from "../services/heyreach";

const router = Router();

type ProviderStatus = "connected" | "not_connected";

type AuthData = {
  apiKey?: string;
  accessToken?: string;
  tableId?: string; 
  [key: string]: any;
};

// Helper to extract ID from URL
function extractClayID(input: string): { viewId: string | null, tableId: string | null } {
  if (!input) return { viewId: null, tableId: null };
  const cleanInput = input.trim();
  if (cleanInput.startsWith("http")) {
    const viewMatch = cleanInput.match(/(gv_[a-zA-Z0-9]+)/);
    const tableMatch = cleanInput.match(/(t_[a-zA-Z0-9]+)/);
    return { viewId: viewMatch ? viewMatch[0] : null, tableId: tableMatch ? tableMatch[0] : null };
  }
  if (cleanInput.startsWith("gv_")) return { viewId: cleanInput, tableId: null };
  if (cleanInput.startsWith("t_")) return { viewId: null, tableId: cleanInput };
  return { viewId: null, tableId: cleanInput };
}

const parseAuthData = (raw?: string | null): AuthData | null => {
  if (!raw) return null;
  try {
    const decrypted = decrypt(raw);
    return JSON.parse(decrypted);
  } catch (err) {
    try { return JSON.parse(raw!); } catch (e) { return null; }
  }
};

// Return type definition for checkers
type CheckerResult = { success: boolean; message?: string };

const providerCheckers: Record<
  string,
  (auth: AuthData | null) => Promise<CheckerResult>
> = {
  stripe: async (auth) => {
    if (!auth?.apiKey) return { success: false, message: "Missing API Key" };
    try {
      const stripe = new Stripe(auth.apiKey.trim(), { apiVersion: "2024-06-20" as any });
      await stripe.balance.retrieve();
      return { success: true };
    } catch (e: any) { return { success: false, message: e.message }; }
  },

  hubspot: async (auth) => {
    if (!auth?.accessToken) return { success: false, message: "Missing Token" };
    try {
      await axios.get("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
        headers: { Authorization: `Bearer ${auth.accessToken.trim()}` },
      });
      return { success: true };
    } catch (e: any) { return { success: false, message: e.message }; }
  },

  clay: async (auth) => {
    if (!auth?.apiKey || !auth?.tableId) return { success: false, message: "Missing API Key or Table ID" };
    
    const apiKey = auth.apiKey.trim();
    const { viewId, tableId } = extractClayID(auth.tableId);
    const headers = { "X-API-Key": apiKey };

    // 1. Try View
    if (viewId) {
      try {
        await axios.get(`https://api.clay.com/v3/views/${viewId}/records?limit=1`, { headers });
        return { success: true };
      } catch (e: any) { 
        if (e.response?.status === 401 || e.response?.status === 403) {
           return { success: false, message: `Clay Permission Error: ${e.response.data.message || "Unauthorized"}` };
        }
      }
    }

    // 2. Try Table
    if (tableId) {
      try {
        await axios.get(`https://api.clay.com/v3/tables/${tableId}/records?limit=1`, { headers });
        return { success: true };
      } catch (e: any) {
        if (e.response?.status === 401 || e.response?.status === 403) {
           return { success: false, message: `Clay Permission Error: ${e.response.data.message || "Unauthorized"}` };
        }
      }
    }

    // 3. General Check
    try {
      await axios.get(`https://api.clay.com/v3/workspaces`, { headers });
      return { success: true };
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message;
      return { success: false, message: `Clay Error: ${msg}` };
    }
  },
};

// --- ROUTES ---

router.get("/", async (req: Request, res: Response) => {
  const workspaceId = String(req.query.workspaceId || "");
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
  const integrations = await prisma.integrationConnection.findMany({ where: { workspaceId } });
  return res.json(integrations.map((i) => ({
    provider: i.provider,
    status: i.status as ProviderStatus,
    hasAuth: !!i.authData,
  })));
});

router.post("/:provider/check", async (req: Request, res: Response) => {
  const { provider } = req.params;
  const { workspaceId } = req.body;

  if (!workspaceId) return res.status(400).json({ error: "workspaceId is required" });

  let conn = await prisma.integrationConnection.findFirst({ where: { workspaceId, provider } });
  const authData = parseAuthData(conn?.authData ?? null);
  
  let result: CheckerResult = { success: false, message: "Unknown provider" };
  
  if (providerCheckers[provider]) {
    result = await providerCheckers[provider](authData);
  } else {
    // Fallback for providers without strict checkers
    if (authData && Object.values(authData).some(v => v && typeof v === 'string' && v.trim().length > 0)) {
        result = { success: true };
    } else {
        result = { success: false, message: "No credentials found" };
    }
  }

  const newStatus: ProviderStatus = result.success ? "connected" : "not_connected";

  if (!conn) {
    conn = await prisma.integrationConnection.create({
      data: { workspaceId, provider, status: newStatus, authData: null },
    });
  } else if (conn.status !== newStatus) {
    await prisma.integrationConnection.update({
      where: { id: conn.id },
      data: { status: newStatus },
    });
  }

  if (!result.success) {
    return res.status(400).json({ 
      provider, 
      status: newStatus, 
      error: result.message 
    });
  }

  return res.json({ provider, status: newStatus, hasAuth: !!conn.authData });
});

router.post("/:provider/disconnect", async (req: Request, res: Response) => {
  const { provider } = req.params;
  const { workspaceId } = req.body;
  if (!workspaceId) return res.status(400).json({ error: "workspaceId is required" });
  const conn = await prisma.integrationConnection.findFirst({ where: { workspaceId, provider } });
  if (conn) {
    await prisma.integrationConnection.update({ where: { id: conn.id }, data: { status: "not_connected", authData: null } });
  }
  return res.json({ provider, status: "not_connected", hasAuth: false });
});

router.post("/:provider/sync", async (req: Request, res: Response) => {
  const { provider } = req.params;
  const { workspaceId } = req.body;
  if (provider !== 'clay') return res.status(400).json({ error: "Sync only supported for Clay." });

  const conn = await prisma.integrationConnection.findFirst({ where: { workspaceId, provider } });
  const auth = parseAuthData(conn?.authData);

  if (!auth || !auth.apiKey || !auth.tableId) return res.status(400).json({ error: "Missing credentials." });

  try {
    const apiKey = auth.apiKey.trim();
    const { viewId, tableId } = extractClayID(auth.tableId);
    const headers = { "X-API-Key": apiKey };
    let records: any[] = [];

    if (viewId) {
      try {
        const res = await axios.get(`https://api.clay.com/v3/views/${viewId}/records?limit=50`, { headers });
        records = res.data.records || res.data || [];
      } catch (e) {}
    }
    if (records.length === 0 && tableId) {
      try {
        const res = await axios.get(`https://api.clay.com/v3/tables/${tableId}/records?limit=50`, { headers });
        records = res.data.records || res.data || [];
      } catch (e) {}
    }

    if (records.length === 0) return res.status(400).json({ error: "Could not fetch records. Check ID or permissions." });

    let importedCount = 0;
    for (const record of records) {
      const fields = record.fields || record; 
      const email = fields["Email"] || fields["email"] || fields["Work Email"];
      const linkedin = fields["LinkedIn"] || fields["LinkedIn URL"] || fields["Profile Link"];
      const name = fields["Name"] || fields["Full Name"] || "Unknown";

      if (email || linkedin) {
        const [firstName, ...lastNameParts] = (typeof name === 'string' ? name : 'Unknown').split(" ");
        const lastName = lastNameParts.join(" ");

        await prisma.contact.upsert({
          where: { id: `clay-${record.id}` },
          update: { firstName, lastName, email: email || undefined, linkedinUrl: linkedin || undefined },
          create: {
            id: `clay-${record.id}`,
            workspaceId,
            email: email || null,
            linkedinUrl: linkedin || null,
            firstName,
            lastName,
            status: "prospect",
          }
        });
        
        const contact = await prisma.contact.findUnique({ where: { id: `clay-${record.id}` } });
        if(contact) {
            const existingLead = await prisma.lead.findFirst({ where: { contactId: contact.id }});
            if(!existingLead) {
                await prisma.lead.create({
                    data: { 
                      workspaceId, 
                      contactId: contact.id, 
                      status: "new", 
                      email: contact.email || "", // Populate flat field
                      fullName: `${firstName} ${lastName}`,
                      source: "Clay" // ✅ Fixed: leadSource -> source
                    }
                });
            }
        }
        importedCount++;
      }
    }
    return res.json({ success: true, imported: importedCount });
  } catch (error: any) {
    return res.status(500).json({ error: "Sync failed", details: error.message });
  }
});

// 1. GET CAMPAIGNS (Proxy)
router.get("/heyreach/campaigns", async (req: Request, res: Response) => {
  const { workspaceId } = req.query;
  if (!workspaceId) return res.status(400).json({ error: "Missing workspaceId" });

  try {
    // Fetch the saved API key from DB
    const conn = await prisma.integrationConnection.findFirst({
      where: { workspaceId: String(workspaceId), provider: "heyreach", status: "connected" }
    });

    if (!conn || !conn.authData) {
      return res.status(403).json({ error: "HeyReach not connected." });
    }

    const auth = parseAuthData(conn.authData);
    if (!auth?.apiKey) return res.status(403).json({ error: "Invalid credentials." });

    const campaigns = await heyReachService.getCampaigns(auth.apiKey);
    return res.json({ campaigns });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 2. EXPORT LEADS TO CAMPAIGN
router.post("/heyreach/export", async (req: Request, res: Response) => {
  const { workspaceId, campaignId, leadIds } = req.body;

  if (!workspaceId || !campaignId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // A. Get Credentials
    const conn = await prisma.integrationConnection.findFirst({
      where: { workspaceId, provider: "heyreach" }
    });
    const auth = parseAuthData(conn?.authData);
    if (!auth?.apiKey) return res.status(403).json({ error: "HeyReach API Key missing." });

    // B. Fetch Leads from DB
    // If leadIds provided, fetch specific. Else fetch ALL new leads.
    const whereCondition = leadIds && leadIds.length > 0 
      ? { id: { in: leadIds }, workspaceId }
      : { workspaceId }; // Default to all if no IDs passed

    const leads = await prisma.lead.findMany({ where: whereCondition });

    // C. Push to HeyReach
    const result = await heyReachService.exportLeadsToCampaign(auth.apiKey, campaignId, leads);

    // D. Optional: Update Lead Status or Add Activity Log
    // await prisma.lead.updateMany(...)

    return res.json(result);

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});
export default router;