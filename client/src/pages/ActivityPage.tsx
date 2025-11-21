import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { API_BASE_URL } from "../config";

type ActivityEvent = {
  id: string;
  ts: string; // human-readable timestamp
  source:
    | "Clay"
    | "Apollo"
    | "ZoomInfo"
    | "HeyReach"
    | "Lemlist"
    | "Instantly"
    | "System";
  category: "Prospecting" | "Outbound" | "System";
  type:
    | "lead_imported"
    | "id_synced"
    | "reply_received"
    | "sequence_started"
    | "sequence_ended"
    | "meeting_booked"
    | "deal_won"
    | "deal_lost";
  revenuelaId?: string;
  summary: string;
  details?: string;
};

const SOURCE_FILTERS: {
  id: string;
  label: string;
  value: ActivityEvent["source"] | "all";
}[] = [
  { id: "all", label: "All sources", value: "all" },
  { id: "clay", label: "Clay", value: "Clay" },
  { id: "apollo", label: "Apollo", value: "Apollo" },
  { id: "zoominfo", label: "ZoomInfo", value: "ZoomInfo" },
  { id: "heyreach", label: "HeyReach", value: "HeyReach" },
  { id: "lemlist", label: "Lemlist", value: "Lemlist" },
  { id: "instantly", label: "Instantly", value: "Instantly" },
  { id: "system", label: "System", value: "System" },
];

const CATEGORY_FILTERS: {
  id: string;
  label: string;
  value: ActivityEvent["category"] | "all";
}[] = [
  { id: "all", label: "All categories", value: "all" },
  { id: "prospecting", label: "Prospecting", value: "Prospecting" },
  { id: "outbound", label: "Outbound", value: "Outbound" },
  { id: "system", label: "System", value: "System" },
];

function sourceBadge(source: ActivityEvent["source"]) {
  const base = "px-2 py-0.5 rounded-full text-[10px] font-medium";
  switch (source) {
    case "Clay":
      return `${base} bg-cyan-500/10 text-cyan-300 border border-cyan-500/40`;
    case "Apollo":
      return `${base} bg-indigo-500/10 text-indigo-300 border border-indigo-500/40`;
    case "ZoomInfo":
      return `${base} bg-emerald-500/10 text-emerald-300 border border-emerald-500/40`;
    case "HeyReach":
      return `${base} bg-purple-500/10 text-purple-300 border border-purple-500/40`;
    case "Lemlist":
      return `${base} bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/40`;
    case "Instantly":
      return `${base} bg-amber-500/10 text-amber-300 border border-amber-500/40`;
    case "System":
    default:
      return `${base} bg-slate-700/40 text-slate-200 border border-slate-500/40`;
  }
}

function typeLabel(type: ActivityEvent["type"]) {
  switch (type) {
    case "lead_imported":
      return "Lead imported";
    case "id_synced":
      return "ID synced";
    case "reply_received":
      return "Reply received";
    case "sequence_started":
      return "Sequence started";
    case "sequence_ended":
      return "Sequence ended";
    case "meeting_booked":
      return "Meeting booked";
    case "deal_won":
      return "Deal won";
    case "deal_lost":
      return "Deal lost";
    default:
      return type;
  }
}

const API_BASE = API_BASE_URL;
const WORKSPACE_ID = "demo-workspace-1"; // TODO: replace with real workspace id

export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [sourceFilter, setSourceFilter] = useState<
    ActivityEvent["source"] | "all"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<
    ActivityEvent["category"] | "all"
  >("all");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const res = await fetch(
          `${API_BASE}/api/activity?workspaceId=${encodeURIComponent(
            WORKSPACE_ID
          )}`
        );

        const contentType = res.headers.get("Content-Type") || "";

        if (!res.ok) {
          let message = `Activity API error (${res.status})`;
          try {
            if (contentType.includes("application/json")) {
              const errJson = await res.json();
              if (errJson && typeof errJson.error === "string") {
                message = errJson.error;
              }
            } else {
              const text = await res.text();
              if (text && text.trim().length > 0) {
                message = text.slice(0, 200);
              }
            }
          } catch {
            // ignore parse errors
          }
          throw new Error(message);
        }

        if (!contentType.includes("application/json")) {
          const text = await res.text();
          console.error("Activity API returned non-JSON:", text);
          throw new Error(
            "Activity API returned non-JSON response. Check that /api/activity returns JSON."
          );
        }

        const json = await res.json();
        const apiEvents: ActivityEvent[] = Array.isArray(json)
          ? json
          : Array.isArray(json.events)
          ? json.events
          : [];

        setEvents(apiEvents);
        setStatus("idle");
      } catch (err: any) {
        console.error("Failed to load activity:", err);
        setErrorMessage(
          err?.message ||
            "Failed to load activity. Check that the backend /api/activity route is running."
        );
        setStatus("error");
      }
    };

    fetchActivity();
  }, []);

  const filteredEvents = events.filter((ev) => {
    if (sourceFilter !== "all" && ev.source !== sourceFilter) return false;
    if (categoryFilter !== "all" && ev.category !== categoryFilter) return false;
    return true;
  });

  const totalEvents = events.length;
  const prospectingCount = events.filter(
    (e) => e.category === "Prospecting"
  ).length;
  const outboundCount = events.filter((e) => e.category === "Outbound").length;
  const systemCount = events.filter((e) => e.category === "System").length;

  return (
    <div>
      <PageHeader
        title="Activity"
        subtitle="Unified timeline of GTM events across prospecting and outbound tools, stitched with Revenuela IDs."
      />

      {status === "loading" && !events.length && (
        <div className="mt-2 mb-3 text-xs text-slate-400">
          Loading recent activity…
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="mt-2 mb-3 rounded-md border border-rose-700 bg-rose-900/40 px-3 py-2 text-[11px] text-rose-100">
          {errorMessage}
        </div>
      )}

      {/* Summary cards */}
      <section className="mt-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="text-slate-400 mb-1">Total events (last sample)</div>
          <div className="text-slate-100 text-lg font-semibold">
            {totalEvents.toString()}
          </div>
        </div>
        <div className="px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="text-slate-400 mb-1">Prospecting</div>
          <div className="text-cyan-300 text-lg font-semibold">
            {prospectingCount.toString()}
          </div>
        </div>
        <div className="px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="text-slate-400 mb-1">Outbound</div>
          <div className="text-purple-300 text-lg font-semibold">
            {outboundCount.toString()}
          </div>
        </div>
        <div className="px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="text-slate-400 mb-1">System / Sync</div>
          <div className="text-slate-200 text-lg font-semibold">
            {systemCount.toString()}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="mb-4 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex flex-wrap gap-2">
          {SOURCE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setSourceFilter(f.value)}
              className={`px-3 py-1.5 rounded-full border text-xs ${
                sourceFilter === f.value
                  ? "bg-slate-100 text-slate-900 border-slate-100"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="h-px flex-1 bg-slate-800 mx-2 hidden md:block" />
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setCategoryFilter(f.value)}
              className={`px-3 py-1.5 rounded-full border text-xs ${
                categoryFilter === f.value
                  ? "bg-slate-100 text-slate-900 border-slate-100"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        {filteredEvents.length === 0 ? (
          <div className="text-xs text-slate-500">
            No activity matches the selected filters yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredEvents.map((ev, idx) => (
              <li key={ev.id} className="flex gap-3">
                {/* Timeline rail */}
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-slate-400 mt-1" />
                  {idx < filteredEvents.length - 1 && (
                    <div className="flex-1 w-px bg-slate-800 mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2 border-b border-slate-800/70 last:border-b-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">
                        {ev.ts}
                      </span>
                      <span className={sourceBadge(ev.source)}>{ev.source}</span>
                      <span className="text-[11px] text-slate-500">
                        {typeLabel(ev.type)}
                      </span>
                    </div>
                    {ev.revenuelaId && (
                      <span className="text-[11px] text-slate-500">
                        ID:{" "}
                        <span className="text-slate-200">{ev.revenuelaId}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-slate-100 text-sm">{ev.summary}</div>
                  {ev.details && (
                    <div className="text-[11px] text-slate-400 mt-1">
                      {ev.details}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
