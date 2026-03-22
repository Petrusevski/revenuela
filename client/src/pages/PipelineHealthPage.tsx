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
} from "lucide-react";
import { API_BASE_URL } from "../../config";
import SeedBanner from "../components/SeedBanner";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function relTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function channelColor(ch: string) {
  const map: Record<string, string> = {
    email:       "text-blue-400 bg-blue-500/10 border-blue-500/20",
    linkedin:    "text-sky-400 bg-sky-500/10 border-sky-500/20",
    enrichment:  "text-violet-400 bg-violet-500/10 border-violet-500/20",
    crm:         "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    billing:     "text-amber-400 bg-amber-500/10 border-amber-500/20",
    prospecting: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    automation:  "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
  };
  return map[ch] ?? "text-slate-400 bg-slate-700/30 border-slate-700";
}

function statusCfg(status: ToolStatus) {
  switch (status) {
    case "healthy": return { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Healthy" };
    case "warning": return { icon: AlertTriangle, color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",   label: "Warning" };
    case "silent":  return { icon: WifiOff,       color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20",     label: "Silent"  };
    case "never":   return { icon: XCircle,       color: "text-slate-500",   bg: "bg-slate-700/30 border-slate-700",      label: "No events" };
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PipelineHealthPage() {
  const [summary, setSummary]     = useState<Summary | null>(null);
  const [tools, setTools]         = useState<ToolHealth[]>([]);
  const [alarms, setAlarms]       = useState<Alarm[]>([]);
  const [loading, setLoading]     = useState(true);
  const [workspaceId, setWorkspaceId] = useState("");
  const [filterChannel, setFilterChannel] = useState("all");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const token = () => localStorage.getItem("iqpipe_token") ?? "";

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/workspaces/primary`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.id) setWorkspaceId(d.id); })
      .catch(() => {});
  }, []);

  const load = useCallback(async (wsId: string) => {
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
        setLastRefresh(new Date());
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    load(workspaceId);
    const id = setInterval(() => load(workspaceId), 30000);
    return () => clearInterval(id);
  }, [workspaceId, load]);

  const channels = ["all", ...Array.from(new Set(tools.map((t) => t.channel))).sort()];
  const filtered = tools.filter((t) => filterChannel === "all" || t.channel === filterChannel);

  const errorAlarms   = alarms.filter((a) => a.severity === "error");
  const warnAlarms    = alarms.filter((a) => a.severity === "warning");
  const infoAlarms    = alarms.filter((a) => a.severity === "info");

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity size={18} className="text-indigo-400" />
          <div>
            <h1 className="text-base font-bold text-white leading-none">Pipeline Health</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">Per-tool event rates, silence detection, and discrepancy alerts</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-600 tabular-nums">{relTime(lastRefresh.toISOString())}</span>
          <button
            onClick={() => { setLoading(true); load(workspaceId); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Connected",   value: summary.connectedTools,  icon: Wifi,          color: "text-indigo-400" },
            { label: "Healthy",     value: summary.healthyTools,    icon: CheckCircle2,  color: "text-emerald-400" },
            { label: "Alarms",      value: summary.alarmTools,      icon: AlertTriangle, color: summary.alarmTools > 0 ? "text-amber-400" : "text-slate-600" },
            { label: "Events 24h",  value: summary.totalEvents24h,  icon: Zap,           color: "text-blue-400" },
            { label: "Events 7d",   value: summary.totalEvents7d,   icon: TrendingUp,    color: "text-violet-400" },
          ].map((card) => (
            <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
              <card.icon size={15} className={card.color} />
              <span className="text-2xl font-bold text-white tabular-nums">{card.value.toLocaleString()}</span>
              <span className="text-[11px] text-slate-500">{card.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Alarms */}
      {alarms.length > 0 && (
        <div className="space-y-2">
          {[
            { list: errorAlarms,   bg: "bg-rose-500/6 border-rose-500/20",   icon: <XCircle size={13} className="text-rose-400 shrink-0 mt-0.5" /> },
            { list: warnAlarms,    bg: "bg-amber-500/6 border-amber-500/20", icon: <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" /> },
            { list: infoAlarms,    bg: "bg-sky-500/6 border-sky-500/20",     icon: <Info size={13} className="text-sky-400 shrink-0 mt-0.5" /> },
          ].map(({ list, bg, icon }) =>
            list.map((alarm, i) => (
              <div key={`${alarm.tool}-${i}`} className={`flex items-start gap-2.5 px-4 py-2.5 rounded-xl border text-sm ${bg}`}>
                {icon}
                <span className="text-slate-200">{alarm.message}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Channel filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={13} className="text-slate-600" />
        {channels.map((ch) => (
          <button
            key={ch}
            onClick={() => setFilterChannel(ch)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterChannel === ch
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-slate-800 border-slate-700/60 text-slate-500 hover:text-slate-200 hover:border-slate-600"
            }`}
          >
            {ch === "all" ? "All" : ch}
          </button>
        ))}
      </div>

      {/* Tool table */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-slate-600 text-sm gap-2">
          <RefreshCw size={14} className="animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <SeedBanner onSeeded={() => load(workspaceId)} />
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["Tool", "Status", "Last Event", "24h", "7d", "Last Type"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider ${i >= 3 && i <= 4 ? "text-right" : ""} ${i === 5 ? "hidden md:table-cell" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filtered.map((t) => {
                const sc = statusCfg(t.status);
                return (
                  <tr key={t.tool} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm">{t.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${channelColor(t.channel)}`}>
                          {t.channel}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${sc.bg}`}>
                        <sc.icon size={10} className={sc.color} />
                        <span className={sc.color}>{sc.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Clock size={11} />
                        {t.lastEventAt ? relTime(t.lastEventAt) : "never"}
                        {t.status === "warning" && t.hoursSinceLast && (
                          <span className="text-amber-600 text-[10px]">({t.hoursSinceLast}h / {t.silenceThresholdHours}h)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono text-sm font-medium ${t.events24h > 0 ? "text-white" : "text-slate-700"}`}>
                        {t.events24h.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono text-sm ${t.events7d > 0 ? "text-slate-400" : "text-slate-700"}`}>
                        {t.events7d.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {t.lastEventType ? (
                        <code className="text-[11px] px-1.5 py-0.5 bg-slate-800 rounded text-indigo-300 font-mono">
                          {t.lastEventType}
                        </code>
                      ) : (
                        <span className="text-slate-700 text-xs">—</span>
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
  );
}
