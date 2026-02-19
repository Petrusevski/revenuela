import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { API_BASE_URL } from "../../config";
import { Loader2, Search, Sparkles, Send, LayoutGrid, Database } from "lucide-react";

const API_BASE = API_BASE_URL;

type StageId = "prospecting" | "engaged" | "meeting" | "proposal" | "won" | "lost";

type Stage = {
  id: StageId | string;
  label: string;
  count: number;
};

type ProspectingImport = {
  id: string;
  source: string;
  imports: number;
};

type RecentJourney = {
  id: string;
  status: string;
  contactName: string | null;
  createdAt: string;
};

type AppSource = "sourcing" | "enrich" | "outreach";

type AppEvent = {
  id: string;
  source: AppSource;
  type: string;
  contactName: string;
  details: string;
  timestamp: string;
};

type DashboardResponse = {
  stages: Stage[];
  prospectingImports: ProspectingImport[];
  recentJourneys: RecentJourney[];
  events: AppEvent[];
};

const STAGE_COLORS: Record<string, string> = {
  prospecting: "#22d3ee",
  engaged: "#6366f1",
  meeting: "#a855f7",
  proposal: "#f97316",
  won: "#22c55e",
  lost: "#64748b",
  sourcing: "#3b82f6",
  enrich: "#a855f7",
  outreach: "#f97316",
};

const SOURCE_CONFIG: Record<AppSource, { icon: any; color: string; bg: string }> = {
  sourcing: { icon: Search, color: "text-blue-400", bg: "bg-blue-500/10" },
  enrich: { icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/10" },
  outreach: { icon: Send, color: "text-orange-400", bg: "bg-orange-500/10" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Toggle state: 'crm' or 'stack'
  const [funnelView, setFunnelView] = useState<"crm" | "stack">("crm");

  useEffect(() => {
    async function getWs() {
      const token = localStorage.getItem("revenuela_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/workspaces/primary`, { 
          headers: { Authorization: `Bearer ${token}` }
        });
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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [workspaceId]);

  if (loading && !data) {
    return <div className="p-10 flex justify-center text-slate-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>;
  }

  if (!workspaceId) return <div className="p-10 text-slate-400">Please log in.</div>;

  const stages = data?.stages ?? [];
  const totalLeads = stages.reduce((sum, s) => sum + s.count, 0);
  
  // Calculate Stack Data (Aggregation from events or imports)
  const stackData: Stage[] = [
    { id: "sourcing", label: "Sourcing", count: data?.prospectingImports.reduce((sum, i) => sum + i.imports, 0) || 0 },
    { id: "enrich", label: "Enrichment", count: data?.events.filter(e => e.source === "enrich").length || 0 },
    { id: "outreach", label: "Outreach", count: data?.events.filter(e => e.source === "outreach").length || 0 },
  ];

  const currentFunnelData = funnelView === "crm" ? stages : stackData;
  const wonStage = stages.find((s) => s.id === "won");
  const lostStage = stages.find((s) => s.id === "lost");
  const winRate = (wonStage && (wonStage.count + (lostStage?.count || 0)) > 0) 
    ? (wonStage.count / (wonStage.count + (lostStage?.count || 0))) * 100 
    : 0;

  return (
    <div className="pb-10">
      <PageHeader
        title="GTM & Revenue Overview"
        subtitle="Follow every Revenuela ID from prospecting to revenue."
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mt-6">
        <StatCard label="Total Universe" value={totalLeads.toLocaleString()} trend="All connected leads" trendType="neutral" />
        <StatCard label="Win Rate" value={`${Math.round(winRate)}%`} trend="Closed deals" trendType="up" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">GTM Funnel Overview</h2>
              <p className="text-xs text-slate-400">View performance by {funnelView === "crm" ? "CRM stages" : "GTM tool stack"}.</p>
            </div>
            
            {/* Toggle Switch */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button 
                onClick={() => setFunnelView("crm")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${funnelView === "crm" ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Database size={14} /> CRM
              </button>
              <button 
                onClick={() => setFunnelView("stack")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${funnelView === "stack" ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
              >
                <LayoutGrid size={14} /> Stack
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {currentFunnelData.map((stage) => {
              const maxCount = Math.max(...currentFunnelData.map(s => s.count)) || 1;
              const width = `${(stage.count / maxCount) * 100}%`;
              return (
                <div key={stage.id}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-200 font-medium capitalize">{stage.label}</span>
                    <span className="text-slate-400 font-mono">{stage.count.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative">
                    <div 
                      className="h-full absolute left-0 top-0 rounded-full transition-all duration-700 ease-out" 
                      style={{ width, backgroundColor: STAGE_COLORS[stage.id] || "#6366f1", opacity: 0.8 }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold text-slate-100 mb-4">Live Activity</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {data?.events.map((event) => {
              const Config = SOURCE_CONFIG[event.source];
              const Icon = Config.icon;
              return (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className={`p-2 rounded-lg ${Config.bg} ${Config.color}`}><Icon size={14} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center"><span className="text-[10px] font-bold uppercase text-slate-500">{event.source}</span></div>
                    <div className="text-xs text-slate-200 font-medium truncate">{event.contactName}</div>
                    <div className="text-[10px] text-slate-400">{event.type.replace('_', ' ')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Rest of Lead Entry Points and Recent Journeys sections... */}
    </div>
  );
}