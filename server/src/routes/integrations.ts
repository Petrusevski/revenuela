import { google } from "googleapis";

// SCOPES required to read spreadsheets
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

/**
 * Extract Spreadsheet ID from a full URL.
 * e.g., https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit...
 * -> 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
 */
function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Authenticate with Google using Service Account Credentials
 * stored in Environment Variables (for security).
 */
function getAuthClient() {
  // You should store your entire Service Account JSON in one env var or separate fields
  // For Vercel/Production, it's best to base64 encode the JSON file and store it in GOOGLE_SERVICE_KEY_BASE64
  
  const credentials = process.env.GOOGLE_SERVICE_KEY_BASE64 
    ? JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_KEY_BASE64, 'base64').toString())
    : require("../../service-account.json"); // Fallback for local dev

  // ✅ FIXED: Pass configuration object instead of multiple arguments
  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
  });
}

export async function fetchSheetData(sheetUrl: string) {
  const spreadsheetId = extractSpreadsheetId(sheetUrl);
  if (!spreadsheetId) {
    throw new Error("Invalid Google Sheet URL. Could not find ID.");
  }

  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  try {
    // 1. Get the spreadsheet metadata to find the first sheet name
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const firstSheetName = meta.data.sheets?.[0]?.properties?.title;

    if (!firstSheetName) throw new Error("No sheets found in this spreadsheet.");

    // 2. Read rows from the first sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: firstSheetName, // automatic range (reads all data)
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error("No data found in the sheet.");
    }

    // 3. Parse Headers vs Data
    const headers = rows[0].map((h) => h.toLowerCase().trim());
    const dataRows = rows.slice(1);

    // 4. Map to objects
    const leads = dataRows.map((row) => {
      const lead: Record<string, string> = {};
      headers.forEach((header, index) => {
        // Map common header names to your Schema fields
        if (header.includes("name")) lead.name = row[index];
        if (header.includes("first")) lead.firstName = row[index];
        if (header.includes("last")) lead.lastName = row[index];
        if (header.includes("email")) lead.email = row[index];
        if (header.includes("company")) lead.company = row[index];
        if (header.includes("title") || header.includes("role")) lead.title = row[index];
      });
      return lead;
    });

    return leads;
  } catch (error: any) {
    console.error("Google Sheets API Error:", error.message);
    throw new Error("Failed to read Google Sheet. Make sure you shared the sheet with the service account email.");
  }
}