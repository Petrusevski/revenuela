import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { API_BASE_URL } from "../config";
import { Loader2 } from "lucide-react";

const API_BASE = API_BASE_URL;

// --- TYPES ---
type StageId = "prospecting" | "engaged" | "meeting" | "proposal" | "won" | "lost";

type Stage = {
  id: StageId | string;
  label: string;
  count: number;
};

type ProspectingImport = {
  id: string;
  source: string;
  outbound: string | null;
  imports: number;
};

type ToolPerformance = {
  id: string;
  name: string;
  stage: string;
  replyRate: number;
  meetingRate: number;
  winRate: number;
  leadsInfluenced: number;
  customersWon: number;
};

type RevenueSource = {
  label: string;
  value: number;
};

type RecentJourney = {
  id: string;
  status: string;
  accountName: string | null;
  contactName: string | null;
  createdAt: string;
};

type DashboardResponse = {
  stages: Stage[];
  prospectingImports: ProspectingImport[];
  toolPerformance: ToolPerformance[];
  revenueSources: RevenueSource[];
  recentJourneys: RecentJourney[];
};

const STAGE_COLORS: Record<string, string> = {
  prospecting: "#22d3ee",
  engaged: "#6366f1",
  meeting: "#a855f7",
  proposal: "#f97316",
  won: "#22c55e",
  lost: "#64748b",
};

function buildStagePieGradient(stages: Stage[], totalLeads: number) {
  if (!totalLeads || stages.length === 0) return "conic-gradient(#1e293b 0 360deg)";
  let currentAngle = 0;
  const segments: string[] = [];
  for (const stage of stages) {
    const angle = (stage.count / totalLeads) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    const color = STAGE_COLORS[stage.id] || "#e5e7eb";
    segments.push(`${color} ${start}deg ${end}deg`);
    currentAngle = end;
  }
  return `conic-gradient(${segments.join(", ")})`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. FETCH WORKSPACE ID
  useEffect(() => {
    async function getWs() {
      const token = localStorage.getItem("revenuela_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/workspaces/primary`, { headers: { Authorization: `Bearer ${token}` }});
        if(res.ok) {
          const data = await res.json();
          setWorkspaceId(data.id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    getWs();
  }, []);

  // 2. FETCH DASHBOARD DATA
  useEffect(() => {
    if (!workspaceId) return;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("revenuela_token");
        const res = await fetch(`${API_BASE}/api/dashboard?workspaceId=${encodeURIComponent(workspaceId)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Dashboard API error");
        
        const json: DashboardResponse = await res.json();
        setData(json);
      } catch (err: any) {
        console.error("Failed to load dashboard:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [workspaceId]);

  // Loading State
  if (loading && !data) {
    return <div className="p-10 flex justify-center text-slate-500"><Loader2 className="animate-spin mr-2" /> Loading dashboard...</div>;
  }

  if (!workspaceId) return <div className="p-10 text-slate-400">Please log in to view your dashboard.</div>;

  // Compute Derived Data
  const stages = data?.stages ?? [];
  const totalLeads = stages.reduce((sum, s) => sum + s.count, 0);
  const stagePieBg = buildStagePieGradient(stages, totalLeads);
  
  const wonStage = stages.find((s) => s.id === "won");
  const lostStage = stages.find((s) => s.id === "lost");
  const engagedStage = stages.find((s) => s.id === "engaged");
  const meetingStage = stages.find((s) => s.id === "meeting");
  const proposalStage = stages.find((s) => s.id === "proposal");

  const winRate = (wonStage && (wonStage.count + (lostStage?.count || 0)) > 0) 
    ? (wonStage.count / (wonStage.count + (lostStage?.count || 0))) * 100 
    : 0;

  const prospectingImports = data?.prospectingImports ?? [];
  const totalImports = prospectingImports.reduce((sum, i) => sum + i.imports, 0);
  const revenueSources = data?.revenueSources ?? [];
  const maxRevenue = revenueSources.length ? Math.max(...revenueSources.map((r) => r.value || 0)) : 1;
  const toolPerformance = data?.toolPerformance ?? [];
  const recentJourneys = data?.recentJourneys ?? [];

  const formatCurrency = (value: number) => `€${value.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`;

  return (
    <div>
      <PageHeader
        title="GTM & Revenue Overview"
        subtitle="Follow every Revenuela ID from prospecting to revenue. See which tools and stages actually move the needle."
      />

      {error && <div className="mt-4 p-3 bg-rose-900/20 border border-rose-800 text-rose-200 rounded-lg text-sm">{error}</div>}

      {/* KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mt-6">
        <StatCard
          label="Revenuela IDs in universe"
          value={totalLeads.toLocaleString("de-DE")}
          trend="All leads that have touched at least one GTM tool"
          trendType="neutral"
        />
        <StatCard
          label="Engaged (Replied)"
          value={engagedStage?.count.toString() ?? "0"}
          trend={`Reply rate: ${totalLeads ? Math.round((engagedStage?.count || 0) / totalLeads * 100) : 0}%`}
          trendType="up"
        />
        <StatCard
          label="Meetings booked"
          value={meetingStage?.count.toString() ?? "0"}
          trend={`Proposal rate: ${meetingStage?.count ? Math.round((proposalStage?.count || 0) / meetingStage.count * 100) : 0}%`}
          trendType="up"
        />
        <StatCard
          label="Win rate"
          value={`${Math.round(winRate)}%`}
          trend={`Won: ${wonStage?.count ?? 0} · Lost: ${lostStage?.count ?? 0}`}
          trendType={winRate >= 25 ? "up" : "neutral"}
        />
      </section>

      {/* MAIN GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* FUNNEL CHART */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold text-slate-100 mb-1">GTM funnel by stage</h2>
          <p className="text-xs text-slate-400 mb-4">Real-time lead progression based on manual status or CRM sync.</p>

          <div className="space-y-4">
            {stages.map((stage, index) => {
              const maxCount = stages.reduce((max, s) => Math.max(max, s.count), 0) || 1;
              const width = `${(stage.count / maxCount) * 100}%`;
              return (
                <div key={stage.id}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage.id] }} />
                      <span className="text-slate-200 font-medium">{stage.label}</span>
                    </div>
                    <span className="text-slate-400">{stage.count.toLocaleString()} leads</span>
                  </div>
                  <div className="w-full h-4 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative">
                    <div className="h-full absolute left-0 top-0 rounded-full transition-all duration-500" 
                         style={{ width, backgroundColor: STAGE_COLORS[stage.id], opacity: 0.6 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PIE CHART */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-100 mb-1">Lead distribution</h2>
          <p className="text-xs text-slate-400 mb-6">Where your universe currently lives.</p>

          <div className="flex-1 flex items-center justify-center relative">
            <div className="h-48 w-48 rounded-full relative" style={{ background: stagePieBg }}>
               <div className="absolute inset-4 rounded-full bg-slate-950 flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Total</span>
                  <span className="text-2xl font-bold text-white">{totalLeads}</span>
               </div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-2 text-[10px]">
             {stages.map(s => (
                <div key={s.id} className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_COLORS[s.id] }} />
                   <span className="text-slate-300">{s.label}: <span className="text-white font-mono">{s.count}</span></span>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* BOTTOM SECTION: RECENT ACTIVITY & SOURCES */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
         
         {/* Imports Source */}
         <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-sm font-semibold text-slate-100 mb-4">Where prospects enter Revenuela</h2>
            <div className="space-y-3">
              {prospectingImports.map((item) => {
                const pct = totalImports ? Math.round((item.imports / totalImports) * 100) : 0;
                return (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/30 transition-colors">
                     <div className="w-10 text-xs font-bold text-slate-500 text-right">{pct}%</div>
                     <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                           <span className="text-slate-200 font-medium">{item.source}</span>
                           <span className="text-slate-400">{item.imports} Leads</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                     </div>
                  </div>
                );
              })}
              {prospectingImports.length === 0 && <div className="text-xs text-slate-500 text-center py-4">No import data yet.</div>}
            </div>
         </div>

         {/* Recent IDs */}
         <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-sm font-semibold text-slate-100 mb-4">Recent Journeys</h2>
            <div className="space-y-3">
               {recentJourneys.map(j => (
                  <div key={j.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-1.5 rounded">{j.id}</span>
                        <span className="text-[10px] text-slate-500">{new Date(j.createdAt).toLocaleDateString()}</span>
                     </div>
                     <div className="text-xs text-slate-300 truncate">{j.contactName || "Unknown Contact"}</div>
                     <div className="text-[10px] text-emerald-400 mt-1 capitalize">{j.status.replace('_', ' ')}</div>
                  </div>
               ))}
               {recentJourneys.length === 0 && <div className="text-xs text-slate-500 text-center py-4">No leads found.</div>}
            </div>
         </div>

      </section>
    </div>
  );
}