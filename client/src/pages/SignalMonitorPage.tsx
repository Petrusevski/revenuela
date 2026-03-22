import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Filter,
  Wifi,
  WifiOff,
  Info,
  Zap,
  TrendingUp,
  Radio,
} from "lucide-react";
import { API_BASE_URL } from "../../config";

// ── Types ──────────────────────────────────────────────────────────────────

type ToolStatus = "healthy" | "warning" | "silent" | "never";

interface ToolHealth {
  tool: string;
  label: string;
  channel: string;
  status: ToolStatus;
  lastEventAt: string | null;
  lastEventType: string | null;
  hoursSinceLast: number | null;
  silenceThresholdHours: number;
  events24h: number;
  events7d: number;
}

interface Alarm {
  tool: string;
  label: string;
  severity: "error" | "warning" | "info";
  message: string;
}

interface Summary {
  connectedTools: number;
  healthyTools: number;
  alarmTools: number;
  totalEvents24h: number;
  totalEvents7d: number;
}

interface FeedEvent {
  id: string;
  tool: string;
  toolLabel: string;
  channel: string;
  eventType: string;
  recordedAt: string;
  iqLeadId: string;
  meta: Record<string, unknown> | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRelTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function channelColor(channel: string): string {
  switch (channel) {
    case "email":       return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    case "linkedin":    return "text-sky-400 bg-sky-500/10 border-sky-500/20";
    case "enrichment":  return "text-violet-400 bg-violet-500/10 border-violet-500/20";
    case "crm":         return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "billing":     return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "prospecting": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    case "automation":  return "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20";
    default:            return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  }
}

function statusConfig(status: ToolStatus) {
  switch (status) {
    case "healthy": return { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Healthy" };
    case "warning": return { icon: AlertTriangle, color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",   label: "Warning" };
    case "silent":  return { icon: WifiOff,       color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20",     label: "Silent" };
    case "never":   return { icon: XCircle,       color: "text-slate-500",   bg: "bg-slate-700/30 border-slate-700",      label: "No events" };
  }
}

function alarmIcon(severity: string) {
  if (severity === "error")   return <XCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />;
  if (severity === "warning") return <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />;
  return <Info size={14} className="text-sky-400 shrink-0 mt-0.5" />;
}

function alarmBg(severity: string) {
  if (severity === "error")   return "bg-rose-500/8 border-rose-500/20";
  if (severity === "warning") return "bg-amber-500/8 border-amber-500/20";
  return "bg-sky-500/8 border-sky-500/20";
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function SignalMonitorPage() {
  const [summary, setSummary]         = useState<Summary | null>(null);
  const [tools, setTools]             = useState<ToolHealth[]>([]);
  const [alarms, setAlarms]           = useState<Alarm[]>([]);
  const [feed, setFeed]               = useState<FeedEvent[]>([]);
  const [loading, setLoading]         = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [activeTab, setActiveTab]         = useState<"health" | "feed">("health");
  const [feedFilterTool, setFeedFilterTool] = useState<string>("all");
  const [workspaceId, setWorkspaceId]     = useState<string>("");

  const token = () => localStorage.getItem("iqpipe_token") ?? "";

  // Resolve workspace ID once on mount
  useEffect(() => {
    const tk = token();
    if (!tk) return;
    fetch(`${API_BASE_URL}/api/workspaces/primary`, {
      headers: { Authorization: `Bearer ${tk}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.id) setWorkspaceId(d.id); })
      .catch(() => {});
  }, []);

  const fetchOverview = useCallback(async (wsId: string) => {
    if (!wsId) return;
    try {
      const r = await fetch(
        `${API_BASE_URL}/api/signal-health/overview?workspaceId=${wsId}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      if (r.ok) {
        const d = await r.json();
        setSummary(d.summary);
        setTools(d.tools);
        setAlarms(d.alarms);
      }
    } catch {/* silently fail */} finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  const fetchFeed = useCallback(async (wsId: string, toolFilter?: string) => {
    if (!wsId) return;
    setFeedLoading(true);
    try {
      const params = new URLSearchParams({ workspaceId: wsId, limit: "60" });
      if (toolFilter && toolFilter !== "all") params.set("tool", toolFilter);
      const r = await fetch(
        `${API_BASE_URL}/api/signal-health/feed?${params}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      if (r.ok) setFeed(await r.json());
    } catch {/* silently fail */} finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    fetchOverview(workspaceId);
    fetchFeed(workspaceId);
  }, [workspaceId, fetchOverview, fetchFeed]);

  useEffect(() => {
    if (!workspaceId) return;
    const id = setInterval(() => {
      fetchOverview(workspaceId);
      fetchFeed(workspaceId, feedFilterTool === "all" ? undefined : feedFilterTool);
    }, 30000);
    return () => clearInterval(id);
  }, [workspaceId, feedFilterTool, fetchOverview, fetchFeed]);

  useEffect(() => {
    if (!workspaceId) return;
    fetchFeed(workspaceId, feedFilterTool === "all" ? undefined : feedFilterTool);
  }, [workspaceId, feedFilterTool, fetchFeed]);

  const handleRefresh = () => {
    setLoading(true);
    fetchOverview(workspaceId);
    fetchFeed(workspaceId, feedFilterTool === "all" ? undefined : feedFilterTool);
  };

  // Derived filtered tools
  const filteredTools = tools.filter((t) => {
    if (filterChannel !== "all" && t.channel !== filterChannel) return false;
    return true;
  });

  const channels = ["all", ...Array.from(new Set(tools.map((t) => t.channel))).sort()];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-6 space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Radio size={20} className="text-indigo-400" />
            Signal Monitor
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time webhook event health across all connected tools
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Last refresh: {formatRelTime(lastRefresh.toISOString())}
          </span>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm text-slate-300 transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Connected Tools", value: summary.connectedTools, icon: Wifi, color: "text-indigo-400" },
            { label: "Healthy",         value: summary.healthyTools,    icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Alarms",          value: summary.alarmTools,      icon: AlertTriangle, color: summary.alarmTools > 0 ? "text-amber-400" : "text-slate-500" },
            { label: "Events (24h)",    value: summary.totalEvents24h,  icon: Zap, color: "text-blue-400" },
            { label: "Events (7d)",     value: summary.totalEvents7d,   icon: TrendingUp, color: "text-violet-400" },
          ].map((card) => (
            <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
              <card.icon size={16} className={card.color} />
              <span className="text-2xl font-bold text-white">{card.value.toLocaleString()}</span>
              <span className="text-xs text-slate-400">{card.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Alarms panel */}
      {alarms.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle size={12} className="text-amber-400" />
            Active Alerts ({alarms.length})
          </h2>
          <div className="space-y-2">
            {alarms.map((alarm, i) => (
              <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-sm ${alarmBg(alarm.severity)}`}>
                {alarmIcon(alarm.severity)}
                <span className="text-slate-200">{alarm.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800 pb-0">
        {(["health", "feed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeTab === tab
                ? "border-indigo-500 text-indigo-300"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab === "health" ? "Tool Health" : "Live Event Feed"}
          </button>
        ))}
      </div>

      {/* Tool Health tab */}
      {activeTab === "health" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Filter size={13} className="text-slate-500" />
            <div className="flex gap-1.5 flex-wrap">
              {channels.map((ch) => (
                <button
                  key={ch}
                  onClick={() => setFilterChannel(ch)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    filterChannel === ch
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {ch === "all" ? "All channels" : ch}
                </button>
              ))}
            </div>
          </div>

          {/* Tool table */}
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">Loading health data…</div>
          ) : filteredTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-500">
              <Wifi size={32} className="opacity-30" />
              <p className="text-sm">No connected tools match this filter.</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tool</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Event</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">24h</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">7d</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Last Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredTools.map((t) => {
                    const sc = statusConfig(t.status);
                    return (
                      <tr key={t.tool} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="font-medium text-white">{t.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${channelColor(t.channel)}`}>
                              {t.channel}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${sc.bg}`}>
                            <sc.icon size={11} className={sc.color} />
                            <span className={sc.color}>{sc.label}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Clock size={11} />
                            <span>{t.lastEventAt ? formatRelTime(t.lastEventAt) : "never"}</span>
                            {t.status === "warning" && t.hoursSinceLast && (
                              <span className="text-amber-500 text-[10px]">
                                ({t.hoursSinceLast}h / {t.silenceThresholdHours}h threshold)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono font-medium ${t.events24h > 0 ? "text-white" : "text-slate-600"}`}>
                            {t.events24h.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono font-medium ${t.events7d > 0 ? "text-slate-300" : "text-slate-600"}`}>
                            {t.events7d.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {t.lastEventType ? (
                            <code className="text-[11px] px-1.5 py-0.5 bg-slate-800 rounded text-indigo-300">
                              {t.lastEventType}
                            </code>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Live Feed tab */}
      {activeTab === "feed" && (
        <div className="space-y-4">
          {/* Feed filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <Filter size={13} className="text-slate-500" />
            <select
              value={feedFilterTool}
              onChange={(e) => setFeedFilterTool(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All tools</option>
              {tools.map((t) => (
                <option key={t.tool} value={t.tool}>{t.label}</option>
              ))}
            </select>
          </div>

          {feedLoading ? (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">Loading events…</div>
          ) : feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-500">
              <Activity size={32} className="opacity-30" />
              <p className="text-sm">No events recorded yet for selected filter.</p>
              <p className="text-xs text-slate-600 max-w-sm text-center">
                Events appear here once connected tools start sending webhooks to iqpipe.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="divide-y divide-slate-800/40">
                {feed.map((evt) => (
                  <div key={evt.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/20 transition-colors">
                    <div className="mt-0.5 shrink-0">
                      <Zap size={13} className="text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white text-sm">{evt.toolLabel}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${channelColor(evt.channel)}`}>
                          {evt.channel}
                        </span>
                        <code className="text-[11px] px-1.5 py-0.5 bg-slate-800 rounded text-indigo-300">
                          {evt.eventType}
                        </code>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-slate-500 font-mono">{evt.iqLeadId}</span>
                        {evt.meta && Object.keys(evt.meta).length > 0 && (
                          <span className="text-[11px] text-slate-500 truncate max-w-xs">
                            {Object.entries(evt.meta).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0 mt-0.5">
                      {formatRelTime(evt.recordedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
