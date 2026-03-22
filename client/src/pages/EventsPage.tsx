import { useState, useMemo, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import { API_BASE_URL } from "../../config";
import {
  Search, Sparkles, Send, Database, CreditCard,
  Filter, ChevronDown, Loader2, Flame, Thermometer, Snowflake,
} from "lucide-react";

// ─── Standardized GTM Event Schema ─────────────────────────────────────────

type GTMEventType =
  | "contact_sourced"
  | "contact_enriched"
  | "email_sent"
  | "email_opened"
  | "email_clicked"
  | "email_replied"
  | "linkedin_connected"
  | "linkedin_message_sent"
  | "linkedin_replied"
  | "meeting_booked"
  | "deal_created"
  | "deal_won"
  | "deal_lost"
  | "payment_received";

type ToolCategory = "prospecting" | "enrichment" | "outreach" | "crm" | "billing";

type GTMEvent = {
  id: string;
  tool: string;
  toolDisplayName: string;
  toolCategory: ToolCategory;
  eventType: GTMEventType;
  contactName: string;
  contactEmail: string;
  company: string;
  timestamp: string;
  summary: string;
  rawFields: Record<string, string>;
  score?: number | null;
};


// ─── Config ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ToolCategory, { icon: any; color: string; bg: string; label: string }> = {
  prospecting: { icon: Search,     color: "text-cyan-400",    bg: "bg-cyan-500/10",    label: "Prospecting" },
  enrichment:  { icon: Sparkles,   color: "text-purple-400",  bg: "bg-purple-500/10",  label: "Enrichment" },
  outreach:    { icon: Send,       color: "text-orange-400",  bg: "bg-orange-500/10",  label: "Outreach" },
  crm:         { icon: Database,   color: "text-indigo-400",  bg: "bg-indigo-500/10",  label: "CRM" },
  billing:     { icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Billing" },
};

const EVENT_TYPE_LABELS: Record<GTMEventType, string> = {
  contact_sourced:       "Contact Sourced",
  contact_enriched:      "Contact Enriched",
  email_sent:            "Email Sent",
  email_opened:          "Email Opened",
  email_clicked:         "Email Clicked",
  email_replied:         "Email Replied",
  linkedin_connected:    "LinkedIn Connected",
  linkedin_message_sent: "LinkedIn Message",
  linkedin_replied:      "LinkedIn Replied",
  meeting_booked:        "Meeting Booked",
  deal_created:          "Deal Created",
  deal_won:              "Deal Won",
  deal_lost:             "Deal Lost",
  payment_received:      "Payment Received",
};


// ─── Helpers ───────────────────────────────────────────────────────────────

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getToolCategory(cat: string): ToolCategory {
  if (cat === "enrichment") return "enrichment";
  if (cat === "outreach") return "outreach";
  if (cat === "crm") return "crm";
  if (cat === "billing") return "billing";
  return "prospecting";
}

// ─── Score pill ────────────────────────────────────────────────────────────

function ScorePill({ score }: { score?: number | null }) {
  if (score == null) return <span className="text-[10px] text-slate-600 font-mono">—</span>;
  if (score >= 70) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-900/30 border border-rose-700/40 text-rose-300 text-[10px] font-semibold">
      <Flame size={9} /> Hot · {score}
    </span>
  );
  if (score >= 40) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/30 border border-amber-700/40 text-amber-300 text-[10px] font-semibold">
      <Thermometer size={9} /> Warm · {score}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-900/30 border border-sky-700/40 text-sky-300 text-[10px] font-semibold">
      <Snowflake size={9} /> Cold · {score}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────

export default function EventsPage() {
  const [events, setEvents]         = useState<GTMEvent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [toolFilter, setToolFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch]         = useState("");

  useEffect(() => {
    const token = localStorage.getItem("iqpipe_token");
    if (!token) { setLoading(false); return; }
    fetch(`${API_BASE_URL}/api/workspaces/primary`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(({ id: workspaceId }) =>
        fetch(`${API_BASE_URL}/api/activity?workspaceId=${encodeURIComponent(workspaceId)}&limit=200`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      )
      .then(r => r.json())
      .then(data => {
        const mapped: GTMEvent[] = (data.events || []).map((a: any) => ({
          id: a.id,
          tool: a.tool || "system",
          toolDisplayName: a.toolDisplayName || "System",
          toolCategory: getToolCategory(a.toolCategory || "prospecting"),
          eventType: (a.type || "id_synced") as GTMEventType,
          contactName: a.contactName || "Unknown",
          contactEmail: a.contactEmail || "",
          company: a.company || "",
          timestamp: a.ts || new Date().toISOString(),
          summary: a.summary || a.type || "Activity",
          rawFields: a.rawFields || {},
          score: a.score ?? null,
        }));
        setEvents(mapped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const tools = useMemo(() => {
    const ids = Array.from(new Set(events.map(e => e.tool)));
    return ["all", ...ids];
  }, [events]);

  const toolLabels = useMemo(() => {
    const m: Record<string, string> = { all: "All Tools" };
    events.forEach(e => { m[e.tool] = e.toolDisplayName; });
    return m;
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (toolFilter !== "all" && e.tool !== toolFilter) return false;
      if (search && !`${e.contactName} ${e.company} ${e.summary}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [events, toolFilter, search]);

  return (
    <div className="pb-10">
      <PageHeader
        title="Events Feed"
        subtitle="Every GTM event from every connected tool — standardized into one schema."
      />

      {/* ── Event Count ── */}
      <section className="grid grid-cols-1 gap-4 mt-6 mb-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-2xl font-bold text-white">{loading ? "—" : events.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Total events</div>
          <div className="text-[10px] text-slate-600 mt-0.5">all tools</div>
        </div>
      </section>

      {/* ── Filters ── */}
      <section className="mb-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            placeholder="Search contacts, companies, or summaries…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {/* Tool filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {tools.map(t => (
            <button
              key={t}
              onClick={() => setToolFilter(t)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                toolFilter === t
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50"
                  : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600"
              }`}
            >
              {toolLabels[t] || t}
            </button>
          ))}
        </div>
      </section>

      {/* ── Event List ── */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          <span>Event</span>
          <span className="hidden md:block w-28 text-right">Tool</span>
          <span className="hidden lg:block w-36 text-right">Event Type</span>
          <span className="hidden lg:block w-32 text-right">Score</span>
          <span className="w-8" />
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Loading events…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            {events.length === 0
              ? "No events yet. Activities will appear here once leads are imported or actions are recorded."
              : "No events match the selected filters."}
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/70">
            {filtered.map(event => {
              const catCfg = CATEGORY_CONFIG[event.toolCategory];
              const CatIcon = catCfg.icon;
              const isExpanded = expandedId === event.id;

              return (
                <li key={event.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                    className="w-full grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 hover:bg-slate-800/40 transition-colors text-left items-center"
                  >
                    {/* Contact + Summary */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-slate-100 truncate">{event.contactName}</span>
                        <span className="text-xs text-slate-500 truncate">{event.company}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{event.summary}</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">{formatTimestamp(event.timestamp)}</div>
                    </div>

                    {/* Tool */}
                    <div className="hidden md:flex items-center gap-1.5 w-28 justify-end">
                      <div className={`p-1 rounded ${catCfg.bg}`}>
                        <CatIcon size={11} className={catCfg.color} />
                      </div>
                      <span className="text-[11px] text-slate-300">{event.toolDisplayName}</span>
                    </div>

                    {/* Event Type */}
                    <div className="hidden lg:flex w-36 justify-end">
                      <span className="text-[10px] text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md whitespace-nowrap">
                        {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="hidden lg:flex w-32 justify-end">
                      <ScorePill score={event.score} />
                    </div>

                    {/* Expand chevron */}
                    <div className="w-8 flex justify-end">
                      <ChevronDown
                        size={13}
                        className={`text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {/* Expanded Raw Fields */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-slate-950/60">
                      <div className="rounded-xl border border-slate-800 p-4">
                        <div className="flex flex-wrap gap-6 mb-3">
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Tool</div>
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${catCfg.bg} ${catCfg.color}`}>
                              <CatIcon size={11} /> {event.toolDisplayName}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">ICP Score</div>
                            <div className="flex items-center gap-1.5">
                              <ScorePill score={event.score} />
                              <span className="text-[10px] text-slate-500">({EVENT_TYPE_LABELS[event.eventType]})</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Email</div>
                            <div className="text-xs text-slate-300 font-mono">{event.contactEmail}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Timestamp</div>
                            <div className="text-xs text-slate-300 font-mono">{event.timestamp}</div>
                          </div>
                        </div>

                        <div className="border-t border-slate-800 pt-3">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Raw Tool Payload</div>
                          <div className="font-mono text-[11px] space-y-1">
                            {Object.entries(event.rawFields).map(([k, v]) => (
                              <div key={k} className="flex gap-3">
                                <span className="text-indigo-400 w-36 shrink-0">{k}</span>
                                <span className="text-amber-300/80">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
