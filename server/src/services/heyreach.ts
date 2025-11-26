import axios from "axios";

const HEYREACH_API_BASE = "https://api.heyreach.io/api/public";

/**
 * Validates the API Key by trying to fetch campaigns.
 */
export async function checkConnection(apiKey: string) {
  try {
    const res = await axios.get(`${HEYREACH_API_BASE}/campaign/getAll`, {
      headers: { "X-API-KEY": apiKey }
    });
    return res.status === 200;
  } catch (error) {
    console.error("HeyReach Auth Check Failed:", error);
    return false;
  }
}

/**
 * Fetches all campaigns so the user can select a destination.
 */
export async function getCampaigns(apiKey: string) {
  try {
    const res = await axios.get(`${HEYREACH_API_BASE}/campaign/getAll`, {
      headers: { "X-API-KEY": apiKey }
    });
    // HeyReach returns { code: 200, payload: [...] } or just array depending on version.
    // Adjusting for standard payload wrapper:
    return res.data?.payload || res.data || [];
  } catch (error) {
    throw new Error("Failed to fetch HeyReach campaigns.");
  }
}

/**
 * Pushes leads to a specific campaign.
 */
export async function exportLeadsToCampaign(apiKey: string, campaignId: string, leads: any[]) {
  // Format leads for HeyReach API
  // They typically require linkedinUrl as the primary key.
  const formattedLeads = leads.map(lead => ({
    linkedinUrl: lead.linkedin || "", 
    email: lead.email || "",
    firstName: lead.firstName || lead.fullName?.split(" ")[0] || "",
    lastName: lead.lastName || lead.fullName?.split(" ").slice(1).join(" ") || "",
    company: lead.company || ""
  })).filter(l => l.linkedinUrl); // Filter out leads without LinkedIn (HeyReach requirement)

  if (formattedLeads.length === 0) {
    throw new Error("No leads with LinkedIn URLs found to export.");
  }

  try {
    // Using the standard /lead/add endpoint
    const res = await axios.post(
      `${HEYREACH_API_BASE}/campaign/${campaignId}/lead/add`,
      { leads: formattedLeads },
      { headers: { "X-API-KEY": apiKey } }
    );
    return { success: true, count: formattedLeads.length, response: res.data };
  } catch (error: any) {
    console.error("HeyReach Export Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to export leads to HeyReach.");
  }
}