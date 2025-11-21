import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import VaultModal from "../components/VaultModal"; // make sure this exists

type IntegrationStatus = "connected" | "not_connected";

type IntegrationApp = {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  canSync?: boolean; // 👈 New flag to show Sync button
};

type GTMSection = {
  id: string;
  title: string;
  subtitle: string;
  apps: IntegrationApp[];
};

// 🔧 Default map – gets overridden by live data from API
const integrationStatusMap: Record<string, IntegrationStatus> = {
  clay: "not_connected",
  revenuela_crm: "not_connected",
  hubspot: "not_connected",
  heyreach: "not_connected",
  stripe: "not_connected",
  segment: "not_connected",
};

const getStatus = (id: string): IntegrationStatus =>
  integrationStatusMap[id] ?? "not_connected";

// --- GTM SECTIONS (filtered to API-key / webhook friendly tools) -----------

const GTM_SECTIONS: GTMSection[] = [
  {
    id: "prospecting",
    title: "1. Prospecting & Lead Sourcing",
    subtitle:
      "Apps that discover and source ICP-fit leads at the top of your funnel.",
    apps: [
      {
        id: "clay",
        name: "Clay",
        description: "Prospecting & lead lists with powerful enrichment blocks.",
        status: getStatus("clay"),
        canSync: true, // 👈 Enables the Sync button
      },
      {
        id: "apollo_prospecting",
        name: "Apollo (Prospecting)",
        description: "B2B lead database with filters, lists, and sequences.",
        status: getStatus("apollo_prospecting"),
      },
      {
        id: "zoominfo",
        name: "ZoomInfo",
        description: "Enterprise-grade company & contact database.",
        status: getStatus("zoominfo"),
      },
      {
        id: "clearbit_prospecting",
        name: "Clearbit Prospector",
        description: "Find B2B leads by firmographic and technographic filters.",
        status: getStatus("clearbit_prospecting"),
      },
      // LinkedIn Sales Navigator removed (OAuth-only)
      {
        id: "lusha",
        name: "Lusha",
        description: "Contact details & direct dials for prospects.",
        status: getStatus("lusha"),
      },
      {
        id: "hunter",
        name: "Hunter.io",
        description: "Domain-based email discovery for outbound.",
        status: getStatus("hunter"),
      },
      {
        id: "phantombuster",
        name: "PhantomBuster",
        description: "Scraping and automation for social & web prospecting.",
        status: getStatus("phantombuster"),
      },
      {
        id: "builtwith",
        name: "BuiltWith",
        description: "Prospecting by tech stack (SaaS built on specific tools).",
        status: getStatus("builtwith"),
      },
      {
        id: "snov_prospecting",
        name: "Snov.io (Prospecting)",
        description: "Lead lists & email finding for outbound campaigns.",
        status: getStatus("snov_prospecting"),
      },
    ],
  },
  {
    id: "enrichment",
    title: "2. Data Enrichment",
    subtitle:
      "Enrich emails and company records with firmographics, technographics, and more.",
    apps: [
      {
        id: "clearbit_enrich",
        name: "Clearbit Enrichment",
        description: "Real-time firmographic and demographic enrichment.",
        status: getStatus("clearbit_enrich"),
      },
      {
        id: "apollo_enrich",
        name: "Apollo (Enrichment)",
        description: "Enrich existing records with Apollo’s contact data.",
        status: getStatus("apollo_enrich"),
      },
      {
        id: "clay_enrich",
        name: "Clay Enrichment",
        description: "Clay enrich blocks plugged into your existing tables.",
        status: getStatus("clay_enrich"),
      },
      {
        id: "zoominfo_enrich",
        name: "ZoomInfo Enrich",
        description: "Company and contact enrichment at scale.",
        status: getStatus("zoominfo_enrich"),
      },
      {
        id: "dropcontact",
        name: "Dropcontact",
        description: "GDPR-compliant contact data enrichment.",
        status: getStatus("dropcontact"),
      },
      {
        id: "fullcontact",
        name: "FullContact",
        description: "Identity resolution and person-level enrichment.",
        status: getStatus("fullcontact"),
      },
      {
        id: "pdl",
        name: "People Data Labs",
        description: "Developer-focused enrichment API for people & companies.",
        status: getStatus("pdl"),
      },
      {
        id: "leadiq_enrich",
        name: "LeadIQ Enrichment",
        description: "Sales prospect enrichment for outbound workflows.",
        status: getStatus("leadiq_enrich"),
      },
      {
        id: "datagma",
        name: "Datagma",
        description: "Sales enrichment for SMBs and SaaS.",
        status: getStatus("datagma"),
      },
      {
        id: "pipl",
        name: "Pipl",
        description: "Identity and fraud-focused people enrichment.",
        status: getStatus("pipl"),
      },
    ],
  },
  {
    id: "crm",
    title: "3. CRM & Database of Record",
    subtitle:
      "The systems where leads, contacts, and deals live as your single source of truth.",
    apps: [
      {
        id: "revenuela_crm",
        name: "Revenuela CRM",
        description: "Native pipeline and customer record inside Revenuela.",
        status: getStatus("revenuela_crm"),
      },
      {
        id: "hubspot",
        name: "HubSpot CRM",
        description:
          "Two-way sync of contacts, companies, and deals via Private App token.",
        status: getStatus("hubspot"),
      },
      // Salesforce (OAuth) removed for MVP
      {
        id: "pipedrive",
        name: "Pipedrive",
        description: "Deal-centric CRM for SMB sales teams.",
        status: getStatus("pipedrive"),
      },
      {
        id: "closecrm",
        name: "Close",
        description: "CRM with built-in calling & email for inside sales.",
        status: getStatus("closecrm"),
      },
      // Zoho CRM (OAuth) removed for MVP
      {
        id: "freshsales",
        name: "Freshsales",
        description: "CRM from Freshworks with built-in comms.",
        status: getStatus("freshsales"),
      },
      {
        id: "monday_crm",
        name: "monday.com CRM",
        description: "CRM on top of monday’s work OS boards.",
        status: getStatus("monday_crm"),
      },
      {
        id: "notion_crm",
        name: "Notion (CRM DB)",
        description: "Custom CRM database built on Notion pages.",
        status: getStatus("notion_crm"),
      },
      {
        id: "airtable_crm",
        name: "Airtable",
        description: "Flexible CRM-style bases for early-stage teams.",
        status: getStatus("airtable_crm"),
      },
    ],
  },
  {
    id: "outbound",
    title: "4. Outbound & Engagement",
    subtitle:
      "Tools that run outbound campaigns and multi-channel engagement with your leads.",
    apps: [
      {
        id: "heyreach",
        name: "HeyReach",
        description: "LinkedIn outreach automation at account level.",
        status: getStatus("heyreach"),
      },
      {
        id: "lemlist",
        name: "Lemlist",
        description: "Cold email & social sequences with personalization.",
        status: getStatus("lemlist"),
      },
      {
        id: "replyio",
        name: "Reply.io",
        description: "Multi-channel outbound engine for SDR teams.",
        status: getStatus("replyio"),
      },
      // Outreach.io removed (OAuth-only)
      // Salesloft removed (OAuth-focused)
      {
        id: "instanly",
        name: "Instanly.io",
        description: "Cold email automation with high deliverability.",
        status: getStatus("instanly"),
      },
      {
        id: "apollo_sequences",
        name: "Apollo (Sequences)",
        description: "Native sequences leveraging Apollo’s lead data.",
        status: getStatus("apollo_sequences"),
      },
      {
        id: "quickmail",
        name: "QuickMail",
        description: "Cold email outreach for agencies and teams.",
        status: getStatus("quickmail"),
      },
      {
        id: "smartlead",
        name: "Smartlead.ai",
        description: "Multi-inbox cold email engine.",
        status: getStatus("smartlead"),
      },
      {
        id: "warmbox",
        name: "Warmbox.ai",
        description: "Inbox warming and deliverability optimization.",
        status: getStatus("warmbox"),
      },
    ],
  },
  {
    id: "billing",
    title: "5. Billing & Monetization",
    subtitle:
      "Payments, subscriptions, and invoices that close the loop on revenue.",
    apps: [
      {
        id: "stripe",
        name: "Stripe",
        description: "SaaS subscriptions, invoices, and one-off payments.",
        status: getStatus("stripe"),
      },
      {
        id: "paddle",
        name: "Paddle",
        description: "Merchant of record and SaaS billing for global customers.",
        status: getStatus("paddle"),
      },
      {
        id: "chargebee",
        name: "Chargebee",
        description: "Subscription billing, invoicing, and dunning.",
        status: getStatus("chargebee"),
      },
      {
        id: "recurly",
        name: "Recurly",
        description: "Subscription management and recurring billing.",
        status: getStatus("recurly"),
      },
      {
        id: "lemonsqueezy",
        name: "LemonSqueezy",
        description: "Digital product & SaaS billing with tax handling.",
        status: getStatus("lemonsqueezy"),
      },
      {
        id: "braintree",
        name: "Braintree",
        description: "Payments processing and vaulting by PayPal.",
        status: getStatus("braintree"),
      },
      // OAuth-heavy / app-based billing providers removed for MVP:
      // paypal_subs, square, shopify_payments, zoho_subscriptions
    ],
  },
 
 
];

// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  // TODO: replace with real workspaceId from auth/session
  const workspaceId = "demo-workspace-1";

  const [statusMap, setStatusMap] = useState<Record<string, IntegrationStatus>>(
    {}
  );
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [errorProvider, setErrorProvider] = useState<string | null>(null);

  // vault state
  const [vaultOpen, setVaultOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const openVault = (providerId: string) => {
    setSelectedProvider(providerId);
    setVaultOpen(true);
  };

  const closeVault = () => {
    setSelectedProvider(null);
    setVaultOpen(false);
  };

  const handleCheckConnection = async (providerId: string) => {
    setLoadingProvider(providerId);
    setErrorProvider(null);

    try {
      const res = await fetch(`/api/integrations/${providerId}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Connection check failed");
      }

      const data: { provider: string; status: IntegrationStatus } =
        await res.json();

      setStatusMap((prev) => ({
        ...prev,
        [data.provider]: data.status,
      }));
  } catch (err) {
    console.error(err);
    setErrorProvider(providerId);

    // 🔥 force UI to show "Not connected" on failed check
    setStatusMap((prev) => ({
      ...prev,
      [providerId]: "not_connected",
    }));
  } finally {
    setLoadingProvider(null);
  }
  };

  const handleDisconnect = async (providerId: string) => {
  setLoadingProvider(providerId);
  setErrorProvider(null);

  try {
    const res = await fetch(`/api/integrations/${providerId}/disconnect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || "Disconnect failed");
    }

    const data: { provider: string; status: IntegrationStatus } =
      await res.json();

    setStatusMap((prev) => ({
      ...prev,
      [data.provider]: data.status,
    }));
  } catch (err) {
    console.error(err);
    setErrorProvider(providerId);
  } finally {
    setLoadingProvider(null);
  }
};

  const handleVaultSave = async (secrets: Record<string, string>) => {
    if (!selectedProvider) return;

    await fetch("/api/vault/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: selectedProvider,
        workspaceId,
        secrets,
      }),
    });

    await handleCheckConnection(selectedProvider);
    closeVault();
  };

  // initial fetch of statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await fetch(
          `/api/integrations?workspaceId=${encodeURIComponent(workspaceId)}`
        );
        if (!res.ok) throw new Error("Failed to load integrations");

        const data: { provider: string; status: IntegrationStatus }[] =
          await res.json();

        const next: Record<string, IntegrationStatus> = {};
        data.forEach((row) => {
          next[row.provider] = row.status;
        });

        setStatusMap(next);
      } catch (err) {
        console.error(err);
      }
    };

    fetchStatuses();
  }, [workspaceId]);

  const getEffectiveStatus = (app: IntegrationApp): IntegrationStatus =>
    statusMap[app.id] ?? app.status;

  return (
    <div>
      <PageHeader
        title="Integrations"
        subtitle="Connect Revenuela with your GTM stack across every step of the funnel."
      />

      <div className="mt-6 space-y-6">
        {GTM_SECTIONS.map((section) => (
          <div
            key={section.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
          >
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-100">
                {section.title}
              </h2>
              <p className="text-[11px] text-slate-400">{section.subtitle}</p>
            </div>

            <div className="space-y-2">
              {section.apps.map((app) => {
                const status = getEffectiveStatus(app);
                const isLoading = loadingProvider === app.id;
                const hasError = errorProvider === app.id;

                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-[11px] font-semibold text-slate-100 uppercase">
                        {app.name[0]}
                      </div>
                      <div>
                        <div className="text-slate-100 font-medium">
                          {app.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {app.description}
                        </div>
                        {hasError && (
                          <div className="mt-1 text-[10px] text-rose-300">
                            Couldn&apos;t verify connection. Check your vault
                            credentials and try again.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status badge */}
                      <span
                        className={
                          "px-2.5 py-1 rounded-full text-[10px] font-medium border " +
                          (status === "connected"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/50"
                            : "bg-slate-800 text-slate-300 border-slate-700")
                        }
                      >
                        {status === "connected" ? "Connected" : "Not connected"}
                      </span>

                      {/* Action buttons */}
                      {status === "not_connected" && (
                        <button
                          onClick={() => openVault(app.id)}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-full bg-indigo-600 text-[11px] text-white hover:bg-indigo-500 disabled:opacity-60"
                        >
                          {isLoading ? "Opening..." : "Connect via vault"}
                        </button>
                      )}

{status === "connected" && (
  <div className="flex items-center gap-2">
    <button
      onClick={() => handleCheckConnection(app.id)}
      disabled={isLoading}
      className="px-3 py-1.5 rounded-full bg-slate-800 text-[11px] text-slate-200 hover:bg-slate-700 disabled:opacity-60"
    >
      {isLoading ? "Re-checking..." : "Re-check"}
    </button>

    <button
      onClick={() => handleDisconnect(app.id)}
      disabled={isLoading}
      className="px-3 py-1.5 rounded-full bg-rose-700/90 text-[11px] text-rose-50 hover:bg-rose-600 disabled:opacity-60"
    >
      {isLoading ? "Disconnecting..." : "Disconnect"}
    </button>
  </div>
)}

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Vault modal rendered once */}
      <VaultModal
        provider={selectedProvider || ""}
        isOpen={vaultOpen}
        onClose={closeVault}
        onSave={handleVaultSave}
      />
    </div>
  );
}
