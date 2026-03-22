/**
 * n8nClient.ts
 *
 * Connects to a user's n8n instance via its REST API (API key auth).
 * Fetches all saved workflows, parses node types to identify apps used,
 * and stores per-workflow metadata in N8nWorkflowMeta.
 *
 * Does NOT import or render workflow canvas data — metadata only.
 */

import axios from "axios";
import { prisma } from "../db";
import { decrypt } from "../utils/encryption";

// ── Node → App mapping ────────────────────────────────────────────────────────
// Maps n8n node type slugs to human-readable app names.
// Handles both "n8n-nodes-base.{slug}" and trigger variants "{slug}Trigger".

const NODE_APP_MAP: Record<string, string> = {
  // CRM
  hubspot: "HubSpot", pipedrive: "Pipedrive", salesforce: "Salesforce",
  zohocrm: "Zoho CRM", freshsales: "Freshsales", copper: "Copper",
  attio: "Attio", close: "Close CRM",

  // Sales engagement
  apollo: "Apollo", outreach: "Outreach", salesloft: "Salesloft",
  instantly: "Instantly", lemlist: "Lemlist", smartlead: "Smartlead",
  reply: "Reply.io", klenty: "Klenty", mixmax: "Mixmax",
  woodpecker: "Woodpecker", mailshake: "Mailshake", quickmail: "QuickMail",

  // LinkedIn automation
  heyreach: "HeyReach", expandi: "Expandi", dripify: "Dripify",
  waalaxy: "Waalaxy",

  // Email providers
  gmail: "Gmail", sendgrid: "SendGrid", mailchimp: "Mailchimp",
  mailgun: "Mailgun", smtp: "SMTP", imap: "IMAP",
  microsoftOutlook: "Outlook", postmark: "Postmark", sparkpost: "SparkPost",
  sendInBlue: "Brevo", brevo: "Brevo",

  // Data enrichment
  clearbit: "Clearbit", hunter: "Hunter.io", clay: "Clay",
  zoominfo: "ZoomInfo", lusha: "Lusha", cognism: "Cognism",
  snov: "Snov.io", rocketReach: "RocketReach",
  phantombuster: "PhantomBuster", pdl: "People Data Labs",

  // Productivity / docs
  googleSheets: "Google Sheets", googleDrive: "Google Drive",
  googleDocs: "Google Docs", googleCalendar: "Google Calendar",
  googleForms: "Google Forms", googleAnalytics: "Google Analytics",
  airtable: "Airtable", notion: "Notion",
  microsoftExcel: "Excel", microsoftOneDrive: "OneDrive",
  microsoftTeams: "Microsoft Teams", sharepoint: "SharePoint",
  dropbox: "Dropbox", box: "Box",

  // Communication / messaging
  slack: "Slack", discord: "Discord", telegram: "Telegram",
  microsoftOutlookTrigger: "Outlook", intercom: "Intercom",
  drift: "Drift", crisp: "Crisp", freshchat: "Freshchat",
  zendesk: "Zendesk", freshdesk: "Freshdesk", helpscout: "Help Scout",

  // Project management
  jira: "Jira", asana: "Asana", trello: "Trello",
  linear: "Linear", clickup: "ClickUp", monday: "Monday.com",
  basecamp: "Basecamp", todoist: "Todoist", wrike: "Wrike",

  // Dev / engineering
  github: "GitHub", gitlab: "GitLab", bitbucket: "Bitbucket",
  jenkins: "Jenkins", jiraService: "Jira",

  // Billing / finance
  stripe: "Stripe", chargebee: "Chargebee", paddle: "Paddle",
  quickbooks: "QuickBooks", xero: "Xero", recurly: "Recurly",

  // Forms / surveys
  typeform: "Typeform", jotform: "JotForm", surveymonkey: "SurveyMonkey",
  tally: "Tally", formstack: "Formstack",

  // Analytics / BI
  segment: "Segment", mixpanel: "Mixpanel", amplitude: "Amplitude",
  plausible: "Plausible", posthog: "PostHog",

  // AI / LLM
  openAi: "OpenAI", anthropicClaude: "Anthropic", cohere: "Cohere",
  huggingFace: "HuggingFace",

  // Database
  postgres: "PostgreSQL", mysql: "MySQL", mongodb: "MongoDB",
  redis: "Redis", supabase: "Supabase", planetscale: "PlanetScale",

  // Storage / cloud
  s3: "AWS S3", googleCloudStorage: "GCS", cloudflareR2: "Cloudflare R2",

  // Scheduling / calendar
  calendly: "Calendly", cal: "Cal.com", savvycal: "SavvyCal",

  // Phone / SMS
  twilio: "Twilio", vonage: "Vonage", aircall: "Aircall",

  // Marketing
  mailerlite: "MailerLite", activecampaign: "ActiveCampaign",
  klaviyo: "Klaviyo", drip: "Drip", convertkit: "ConvertKit",
  hubspotMarketing: "HubSpot",

  // Automation infra
  httpRequest: "HTTP Request", webhook: "Webhook",
};

// Nodes that are pure flow-control — do not represent external apps
const SKIP_NODES = new Set([
  "if", "switch", "merge", "set", "noOp", "start", "stickyNote",
  "splitInBatches", "itemLists", "dateTime", "moveBinaryData",
  "code", "function", "functionItem", "executeWorkflow",
  "executeWorkflowTrigger", "wait", "stopAndError", "respondToWebhook",
  "compareDatasets", "sort", "limit", "removeDuplicates", "summarize",
  "filter", "aggregate", "html", "markdown", "xml", "crypto",
  "editImage", "compression", "convertToFile", "readBinaryFile",
  "writeBinaryFile", "spreadsheetFile", "extractFromFile",
  "workflowTrigger", "manualTrigger", "errorTrigger",
  "intervalTrigger", "localFileTrigger",
]);

// ── Node parser ───────────────────────────────────────────────────────────────

/**
 * Given a raw n8n node type string like "n8n-nodes-base.googleSheets"
 * or "n8n-nodes-base.googleSheetsTrigger", returns the slug.
 */
function extractSlug(nodeType: string): string {
  // Remove package prefix
  const parts = nodeType.split(".");
  const slug = parts[parts.length - 1];
  // Strip "Trigger" suffix for lookup (keep for trigger detection)
  return slug.replace(/Trigger$/, "");
}

/**
 * Classify the trigger type by inspecting trigger nodes.
 */
function classifyTrigger(nodes: any[]): string {
  const triggerNode = nodes.find(n =>
    n.type?.includes("Trigger") ||
    n.type === "n8n-nodes-base.start" ||
    n.type === "n8n-nodes-base.manualTrigger"
  );
  if (!triggerNode) return "manual";
  const t = (triggerNode.type || "").toLowerCase();
  if (t.includes("webhook"))  return "webhook";
  if (t.includes("schedule") || t.includes("cron") || t.includes("interval")) return "schedule";
  if (t.includes("email") || t.includes("gmail") || t.includes("imap")) return "email";
  if (t.includes("manual"))   return "manual";
  return "event";
}

/**
 * Parse a workflow's nodes array and return deduplicated app names.
 */
export function parseWorkflowApps(nodes: any[]): { apps: string[]; nodeTypes: string[] } {
  const appSet  = new Set<string>();
  const typeSet = new Set<string>();

  for (const node of nodes) {
    const rawType = node.type as string;
    if (!rawType) continue;

    typeSet.add(rawType);
    const slug = extractSlug(rawType);
    if (SKIP_NODES.has(slug)) continue;

    // Direct match
    const appName = NODE_APP_MAP[slug];
    if (appName) {
      appSet.add(appName);
      continue;
    }

    // Fallback: convert camelCase slug to Title Case words
    // e.g. "someUnknownApp" → "Some Unknown App"
    const readable = slug
      .replace(/([A-Z])/g, " $1")
      .trim()
      .replace(/^\w/, c => c.toUpperCase());
    if (readable && readable.length > 1) {
      appSet.add(readable);
    }
  }

  return {
    apps:      [...appSet].sort(),
    nodeTypes: [...typeSet],
  };
}

// ── n8n REST API client ───────────────────────────────────────────────────────

async function n8nGet(baseUrl: string, apiKey: string, path: string): Promise<any> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/v1${path}`;
  const resp = await axios.get(url, {
    headers: { "X-N8N-API-KEY": apiKey, Accept: "application/json" },
    timeout: 15_000,
  });
  return resp.data;
}

export async function testN8nConnection(
  baseUrl: string,
  apiKey: string,
): Promise<{ ok: boolean; version?: string; error?: string }> {
  try {
    const data = await n8nGet(baseUrl, apiKey, "/health");
    return { ok: true, version: data?.status ?? "ok" };
  } catch {
    // /health might not exist in older n8n — try /workflows with limit=1
    try {
      await n8nGet(baseUrl, apiKey, "/workflows?limit=1");
      return { ok: true };
    } catch (err2: any) {
      const msg: string =
        err2?.response?.data?.message || err2?.message || "Connection failed";
      return { ok: false, error: msg };
    }
  }
}

interface N8nWorkflowListItem {
  id: string;
  name: string;
  active: boolean;
  tags?: { id: string; name: string }[];
  updatedAt?: string;
  description?: string;
}

async function fetchAllWorkflows(
  baseUrl: string,
  apiKey: string,
): Promise<N8nWorkflowListItem[]> {
  const all: N8nWorkflowListItem[] = [];
  let cursor: string | undefined;

  // n8n paginates with cursor
  do {
    const path = cursor
      ? `/workflows?limit=100&cursor=${encodeURIComponent(cursor)}`
      : `/workflows?limit=100`;
    const page = await n8nGet(baseUrl, apiKey, path);
    const items: N8nWorkflowListItem[] = page.data ?? page ?? [];
    all.push(...items);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  return all;
}

async function fetchWorkflowNodes(
  baseUrl: string,
  apiKey: string,
  id: string,
): Promise<any[]> {
  const data = await n8nGet(baseUrl, apiKey, `/workflows/${id}`);
  return data.nodes ?? [];
}

// ── Sync ──────────────────────────────────────────────────────────────────────

/**
 * Sync one workspace's n8n connection: fetch all workflows, parse nodes,
 * upsert N8nWorkflowMeta records.
 */
export async function syncN8nConnection(
  workspaceId: string,
): Promise<{ synced: number; errors: number }> {
  const conn = await prisma.n8nConnection.findUnique({ where: { workspaceId } });
  if (!conn || conn.status === "disconnected") return { synced: 0, errors: 0 };

  let apiKey: string;
  try {
    apiKey = decrypt(conn.apiKeyEnc);
  } catch {
    await prisma.n8nConnection.update({
      where: { workspaceId },
      data: { status: "error", lastError: "Failed to decrypt API key" },
    });
    return { synced: 0, errors: 1 };
  }

  let synced = 0;
  let errors = 0;

  try {
    const workflows = await fetchAllWorkflows(conn.baseUrl, apiKey);

    for (const wf of workflows) {
      try {
        const nodes = await fetchWorkflowNodes(conn.baseUrl, apiKey, wf.id);
        const { apps, nodeTypes } = parseWorkflowApps(nodes);
        const triggerType = classifyTrigger(nodes);
        const tags = (wf.tags ?? []).map((t: any) => t.name ?? t).filter(Boolean);

        await prisma.n8nWorkflowMeta.upsert({
          where:  { workspaceId_n8nId: { workspaceId, n8nId: wf.id } },
          create: {
            workspaceId,
            n8nId:         wf.id,
            name:          wf.name,
            active:        wf.active ?? false,
            tags:          JSON.stringify(tags),
            appsUsed:      JSON.stringify(apps),
            nodeTypes:     JSON.stringify(nodeTypes),
            nodeCount:     nodes.length,
            triggerType,
            description:   wf.description || null,
            lastUpdatedAt: wf.updatedAt ? new Date(wf.updatedAt) : null,
            syncedAt:      new Date(),
          },
          update: {
            name:          wf.name,
            active:        wf.active ?? false,
            tags:          JSON.stringify(tags),
            appsUsed:      JSON.stringify(apps),
            nodeTypes:     JSON.stringify(nodeTypes),
            nodeCount:     nodes.length,
            triggerType,
            description:   wf.description || null,
            lastUpdatedAt: wf.updatedAt ? new Date(wf.updatedAt) : null,
            syncedAt:      new Date(),
          },
        });
        synced++;
      } catch (err: any) {
        console.error(`[n8nClient] Failed to sync workflow ${wf.id}:`, err.message);
        errors++;
      }
    }

    await prisma.n8nConnection.update({
      where: { workspaceId },
      data: {
        status:        "connected",
        lastSyncAt:    new Date(),
        lastError:     null,
        workflowCount: synced,
      },
    });
  } catch (err: any) {
    console.error(`[n8nClient] Sync failed for workspace ${workspaceId}:`, err.message);
    await prisma.n8nConnection.update({
      where: { workspaceId },
      data: { status: "error", lastError: err.message?.slice(0, 500) },
    });
    errors++;
  }

  console.log(`[n8nClient] Workspace ${workspaceId}: synced ${synced} workflows, ${errors} errors`);
  return { synced, errors };
}

/**
 * Sync all connected n8n workspaces. Called from syncPoller every 2 hours.
 */
export async function syncAllN8nConnections(): Promise<void> {
  const connections = await prisma.n8nConnection.findMany({
    where:  { status: { not: "disconnected" } },
    select: { workspaceId: true },
  });

  for (const { workspaceId } of connections) {
    await syncN8nConnection(workspaceId).catch(err =>
      console.error(`[n8nClient] syncAllN8nConnections error for ${workspaceId}:`, err.message)
    );
  }
}
