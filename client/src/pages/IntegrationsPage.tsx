import { useEffect, useState, useMemo } from "react";
import PageHeader from "../components/PageHeader";
import VaultModal from "../components/VaultModal";
import { API_BASE_URL } from "../../config";
import { Search, Filter } from "lucide-react";

type IntegrationStatus = "connected" | "not_connected";

type IntegrationApp = {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  canSync?: boolean;
};

type GTMSection = {
  id: string;
  title: string;
  subtitle: string;
  apps: IntegrationApp[];
};

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

// --- GTM SECTIONS (Updated: Merged Prospecting & Enrichment) -----------

const GTM_SECTIONS: GTMSection[] = [
  {
    id: "prospecting_enrichment",
    title: "1. Prospecting & Enrichment",
    subtitle: "Source leads and enrich data with emails, firmographics, and technographics.",
    apps: [
      { id: "clay", name: "Clay", description: "All-in-one prospecting and enrichment platform.", status: getStatus("clay"), canSync: true },
      { id: "apollo", name: "Apollo", description: "Lead database, enrichment, and sequences.", status: getStatus("apollo") },
      { id: "zoominfo", name: "ZoomInfo", description: "Enterprise-grade company & contact intelligence.", status: getStatus("zoominfo") },
      { id: "clearbit", name: "Clearbit", description: "B2B prospecting and real-time enrichment.", status: getStatus("clearbit") },
      { id: "lusha", name: "Lusha", description: "Contact details & direct dials for prospects.", status: getStatus("lusha") },
      { id: "dropcontact", name: "Dropcontact", description: "GDPR-compliant contact data enrichment.", status: getStatus("dropcontact") },
      { id: "pdl", name: "People Data Labs", description: "Developer-focused enrichment API.", status: getStatus("pdl") },
      { id: "leadiq", name: "LeadIQ", description: "Sales prospect capture and enrichment.", status: getStatus("leadiq") },
    ],
  },
  {
    id: "crm",
    title: "2. CRM & Database of Record",
    subtitle: "The systems where leads, contacts, and deals live as your single source of truth.",
    apps: [
      { id: "revenuela_crm", name: "Revenuela CRM", description: "Native pipeline and customer record inside Revenuela.", status: getStatus("revenuela_crm") },
      { id: "hubspot", name: "HubSpot CRM", description: "Two-way sync of contacts, companies, and deals.", status: getStatus("hubspot") },
      { id: "pipedrive", name: "Pipedrive", description: "Deal-centric CRM for SMB sales teams.", status: getStatus("pipedrive") },
      { id: "closecrm", name: "Close", description: "CRM with built-in calling & email for inside sales.", status: getStatus("closecrm") },
      { id: "freshsales", name: "Freshsales", description: "CRM from Freshworks with built-in comms.", status: getStatus("freshsales") },
      { id: "monday_crm", name: "monday.com CRM", description: "CRM on top of monday’s work OS boards.", status: getStatus("monday_crm") },
      { id: "notion_crm", name: "Notion (CRM DB)", description: "Custom CRM database built on Notion pages.", status: getStatus("notion_crm") },
      { id: "airtable_crm", name: "Airtable", description: "Flexible CRM-style bases for early-stage teams.", status: getStatus("airtable_crm") },
    ],
  },
  {
    id: "outbound",
    title: "3. Outbound & Engagement",
    subtitle: "Tools that run outbound campaigns and multi-channel engagement.",
    apps: [
      { id: "heyreach", name: "HeyReach", description: "LinkedIn outreach automation at account level.", status: getStatus("heyreach") },
      { id: "lemlist", name: "Lemlist", description: "Cold email & social sequences with personalization.", status: getStatus("lemlist") },
      { id: "instantly", name: "Instantly.ai", description: "Cold email automation with unlimited warmups.", status: getStatus("instantly") },
      { id: "smartlead", name: "Smartlead.ai", description: "Multi-inbox cold email engine.", status: getStatus("smartlead") },
    ],
  },
  {
    id: "billing",
    title: "4. Billing & Monetization",
    subtitle: "Payments, subscriptions, and invoices that close the loop on revenue.",
    apps: [
      { id: "stripe", name: "Stripe", description: "SaaS subscriptions, invoices, and payments.", status: getStatus("stripe") },
      { id: "paddle", name: "Paddle", description: "Merchant of record and SaaS billing.", status: getStatus("paddle") },
      { id: "chargebee", name: "Chargebee", description: "Subscription billing, invoicing, and dunning.", status: getStatus("chargebee") },
      { id: "recurly", name: "Recurly", description: "Subscription management and recurring billing.", status: getStatus("recurly") },
      { id: "lemonsqueezy", name: "LemonSqueezy", description: "Digital product & SaaS billing with tax handling.", status: getStatus("lemonsqueezy") },
      { id: "braintree", name: "Braintree", description: "Payments processing and vaulting by PayPal.", status: getStatus("braintree") },
    ],
  },
];

// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  
  // Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [statusMap, setStatusMap] = useState<Record<string, IntegrationStatus>>({});
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [errorProvider, setErrorProvider] = useState<string | null>(null);

  // Vault state
  const [vaultOpen, setVaultOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const API_HEADERS = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("revenuela_token")}`,
  };

  // 1. Fetch Workspace ID on mount
  useEffect(() => {
    async function getWs() {
      if (!localStorage.getItem("revenuela_token")) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/workspaces/primary`, { headers: API_HEADERS });
        if (res.ok) { 
          const data = await res.json(); 
          setWorkspaceId(data.id); 
        }
      } catch (e) { console.error("Failed to load workspace", e); }
    }
    getWs();
  }, []);

  const openVault = (providerId: string) => {
    setSelectedProvider(providerId);
    setVaultOpen(true);
  };

  const closeVault = () => {
    setSelectedProvider(null);
    setVaultOpen(false);
  };

  // 2. Check Status
  const handleCheckConnection = async (providerId: string) => {
    if (!workspaceId) return;
    setLoadingProvider(providerId);
    setErrorProvider(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/integrations/${providerId}/check`, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ workspaceId }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Connection check failed");
      }

      const data = await res.json();
      setStatusMap((prev) => ({ ...prev, [data.provider]: data.status }));
    } catch (err) {
      console.error(err);
      setErrorProvider(providerId);
      setStatusMap((prev) => ({ ...prev, [providerId]: "not_connected" }));
    } finally {
      setLoadingProvider(null);
    }
  };

  // 3. Disconnect
  const handleDisconnect = async (providerId: string) => {
    if (!workspaceId) return;
    setLoadingProvider(providerId);
    setErrorProvider(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/integrations/${providerId}/disconnect`, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ workspaceId }),
      });

      if (!res.ok) throw new Error("Disconnect failed");

      const data = await res.json();
      setStatusMap((prev) => ({ ...prev, [data.provider]: data.status }));
    } catch (err) {
      console.error(err);
      setErrorProvider(providerId);
    } finally {
      setLoadingProvider(null);
    }
  };

  // 4. Save Credentials (Vault)
  const handleVaultSave = async (secrets: Record<string, string>) => {
    if (!selectedProvider || !workspaceId) return;

    closeVault();
    setLoadingProvider(selectedProvider);
    setErrorProvider(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/integrations/${selectedProvider}/check`, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({
          workspaceId,
          ...secrets,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to connect. Check credentials.");
      }

      const data = await res.json();
      setStatusMap((prev) => ({ ...prev, [data.provider]: data.status }));

    } catch (err: any) {
      console.error(err);
      alert(`Connection failed: ${err.message}`);
      setErrorProvider(selectedProvider);
    } finally {
      setLoadingProvider(null);
    }
  };

  // 5. Fetch Initial Statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      if (!workspaceId) return;
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/integrations?workspaceId=${encodeURIComponent(workspaceId)}`,
          { headers: API_HEADERS }
        );
        if (!res.ok) throw new Error("Failed to load integrations");

        const data: { provider: string; status: IntegrationStatus }[] = await res.json();
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

  // --- Filtering Logic ---
  const filteredSections = useMemo(() => {
    return GTM_SECTIONS.map(section => {
      // 1. Check Category Filter
      if (selectedCategory !== "all" && section.id !== selectedCategory) {
        return null;
      }

      // 2. Check Search Filter (on Apps)
      const matchesSearch = section.apps.filter(app => 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        app.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // If search query exists but no apps match, hide section
      if (searchQuery && matchesSearch.length === 0) {
        return null;
      }

      // Return section with filtered apps
      return {
        ...section,
        apps: matchesSearch
      };
    }).filter((section): section is GTMSection => section !== null);
  }, [selectedCategory, searchQuery]);


  return (
    <div>
      <PageHeader
        title="Integrations"
        subtitle="Connect Revenuela with your GTM stack across every step of the funnel."
      />

      {/* --- Search & Filter Controls --- */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search integrations (e.g. Clay, HubSpot)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>

        {/* Category Dropdown */}
        <div className="relative w-full sm:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer transition-all"
          >
            <option value="all">All Categories</option>
            {GTM_SECTIONS.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          {/* Custom Arrow for select */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* --- Content --- */}
      <div className="mt-6 space-y-6">
        {filteredSections.length > 0 ? (
          filteredSections.map((section) => (
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
                              Connection failed. Check credentials.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
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

                        {status === "not_connected" && (
                          <button
                            onClick={() => openVault(app.id)}
                            disabled={isLoading || !workspaceId}
                            className="px-3 py-1.5 rounded-full bg-indigo-600 text-[11px] text-white hover:bg-indigo-500 disabled:opacity-60"
                          >
                            {isLoading ? "Connecting..." : "Connect"}
                          </button>
                        )}

                        {status === "connected" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCheckConnection(app.id)}
                              disabled={isLoading || !workspaceId}
                              className="px-3 py-1.5 rounded-full bg-slate-800 text-[11px] text-slate-200 hover:bg-slate-700 disabled:opacity-60"
                            >
                              {isLoading ? "Checking..." : "Check"}
                            </button>

                            <button
                              onClick={() => handleDisconnect(app.id)}
                              disabled={isLoading || !workspaceId}
                              className="px-3 py-1.5 rounded-full bg-rose-700/90 text-[11px] text-rose-50 hover:bg-rose-600 disabled:opacity-60"
                            >
                              {isLoading ? "..." : "Disconnect"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">No integrations found matching your search.</p>
          </div>
        )}
      </div>

      <VaultModal
        provider={selectedProvider || ""}
        isOpen={vaultOpen}
        onClose={closeVault}
        onSave={handleVaultSave}
      />
    </div>
  );
}