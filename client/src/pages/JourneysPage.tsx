import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "../components/PageHeader";
import { API_BASE_URL } from "../config";
import { 
  Database, Mail, Briefcase, CreditCard, Zap, CheckCircle2, 
  XCircle, Clock, ArrowRight, Layers, Loader2, Search
} from "lucide-react";

// --- TYPES ---
type JourneyStatus = "won" | "pipeline" | "lost";

type Journey = {
  id: string; 
  source: string;
  outbound: string;
  status: JourneyStatus;
  mrr?: string;
  steps: string[]; 
};

type JourneysApiResponse = {
  journeys: Journey[];
};

const API_BASE = API_BASE_URL;
const WORKSPACE_ID = "demo-workspace-1"; 

// --- VISUAL CONFIG ---
const TOOL_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  "Clay":      { icon: Database, color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  "Apollo":    { icon: Search, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  "HeyReach":  { icon: Zap, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
  "Lemlist":   { icon: Mail, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  "HubSpot":   { icon: Briefcase, color: "text-orange-500", bg: "bg-orange-600/10", border: "border-orange-600/20" },
  "Stripe":    { icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  "Manual":    { icon: Layers, color: "text-slate-400", bg: "bg-slate-800", border: "border-slate-700" },
  "default":   { icon: Layers, color: "text-slate-400", bg: "bg-slate-800", border: "border-slate-700" }
};

// --- SUB-COMPONENT: JOURNEY CARD ---

const JourneyRow = ({ journey, index }: { journey: Journey; index: number }) => {
  
  // Dynamic Styles based on status
  const statusStyles = {
    won: { text: "text-emerald-400", badge: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2, glow: "group-hover:shadow-emerald-900/20" },
    lost: { text: "text-rose-400", badge: "bg-rose-500/10 border-rose-500/20", icon: XCircle, glow: "group-hover:shadow-rose-900/20" },
    pipeline: { text: "text-indigo-400", badge: "bg-indigo-500/10 border-indigo-500/20", icon: Clock, glow: "group-hover:shadow-indigo-900/20" }
  }[journey.status] || { text: "text-slate-400", badge: "bg-slate-800", icon: Clock, glow: "" };

  const StatusIcon = statusStyles.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative mb-4"
    >
      {/* Hover Glow Effect (Behind the card) */}
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 opacity-0 group-hover:opacity-100 blur transition duration-500 ${journey.status === 'won' ? 'group-hover:from-emerald-900/50' : ''}`} />

      <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-xl transition-all duration-300 hover:border-slate-700">
        
        {/* HEADER SECTION */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* ID Badge */}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Journey ID</span>
              <div className="font-mono text-sm text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                {journey.id}
              </div>
            </div>

            {/* Source Info */}
            <div className="flex flex-col pl-4 border-l border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Source</span>
              <div className="text-sm font-medium text-white flex items-center gap-1.5">
                {journey.source}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            {journey.mrr && (
              <div className="hidden sm:block px-3 py-1 rounded-full bg-emerald-950/30 border border-emerald-500/20 text-xs font-bold text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                {journey.mrr} MRR
              </div>
            )}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wide ${statusStyles.badge} ${statusStyles.text}`}>
              <StatusIcon size={14} />
              <span>{journey.status}</span>
            </div>
          </div>
        </div>

        {/* PIPELINE VISUALIZATION (Scrollbar hidden via style) */}
        <div 
          className="relative w-full overflow-x-auto overflow-y-hidden py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Firefox/IE hide
        >
          {/* Webkit hide scrollbar */}
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>

          <div className="flex items-center min-w-max">
            
            {/* The "Rail" Line */}
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-800 -translate-y-1/2 -z-10" />

            {journey.steps.map((stepName, i) => {
              const config = TOOL_CONFIG[stepName] || TOOL_CONFIG["default"];
              const Icon = config.icon;
              const isLast = i === journey.steps.length - 1;

              return (
                <div key={i} className="flex items-center">
                  
                  {/* Tool Node */}
                  <div className={`
                    relative z-10 flex flex-col items-center justify-center 
                    h-14 w-14 rounded-xl border bg-slate-950 
                    transition-all duration-300
                    ${config.border}
                    group-hover/node:scale-110 group-hover/node:-translate-y-1
                    shadow-lg
                  `}>
                    <div className={`absolute inset-0 rounded-xl opacity-20 ${config.bg}`} />
                    <Icon size={20} className={`relative z-20 ${config.color}`} />
                    
                    {/* Tooltip Label */}
                    <div className="absolute -bottom-6 text-[10px] font-medium text-slate-400 whitespace-nowrap opacity-80">
                      {stepName}
                    </div>
                  </div>

                  {/* Connector Space */}
                  {!isLast && (
                    <div className="relative w-16 h-[2px] mx-2">
                      {/* Static Line */}
                      <div className="absolute inset-0 bg-slate-800" />
                      
                      {/* Animated Data Packet */}
                      <motion.div 
                        className={`absolute top-0 bottom-0 h-full w-8 bg-gradient-to-r from-transparent via-indigo-500 to-transparent`}
                        animate={{ x: [-20, 64] }} 
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity, 
                          ease: "linear",
                          delay: i * 0.3, 
                          repeatDelay: 0.5
                        }}
                        style={{ opacity: 0.8 }}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Final Outcome Node (Money Bag) */}
            {journey.status === 'won' && (
              <>
                <div className="w-16 h-[2px] bg-slate-800 mx-2 relative overflow-hidden">
                   <motion.div 
                      className="absolute inset-0 w-full h-full bg-emerald-500/50 origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.5, delay: journey.steps.length * 0.3 }}
                   />
                </div>
                <div className="h-14 w-14 rounded-full border-2 border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)] relative z-10">
                  <span className="text-lg font-bold text-emerald-400">$</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN PAGE ---

export default function JourneysPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // 1. FETCH WORKSPACE ID
  useEffect(() => {
    async function getWs() {
      const token = localStorage.getItem("revenuela_token");
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/workspaces/primary`, { headers: { Authorization: `Bearer ${token}` }});
        if(res.ok) {
          const data = await res.json();
          setWorkspaceId(data.id);
        }
      } catch (e) {}
    }
    getWs();
  }, []);

  // 2. FETCH JOURNEYS
  useEffect(() => {
    if (!workspaceId) return;

    const fetchJourneys = async () => {
      setStatus("loading");
      try {
        const token = localStorage.getItem("revenuela_token");
        const res = await fetch(`${API_BASE}/api/journeys?workspaceId=${encodeURIComponent(workspaceId)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const json: JourneysApiResponse = await res.json();
          setJourneys(json.journeys || []);
        }
        setStatus("idle");
      } catch (err: any) {
        console.error("Failed to load journeys:", err);
        setStatus("error"); 
      }
    };

    fetchJourneys();
  }, [workspaceId]);

  const wonCount = useMemo(() => journeys.filter((j) => j.status === "won").length, [journeys]);
  const pipelineCount = useMemo(() => journeys.filter((j) => j.status === "pipeline").length, [journeys]);
  const totalMrr = useMemo(() => journeys.reduce((acc, curr) => acc + (curr.mrr ? parseInt(curr.mrr.replace(/\D/g,'')) : 0), 0), [journeys]);

  if (status === "loading" && journeys.length === 0) {
    return <div className="p-10 flex justify-center text-slate-500"><Loader2 className="animate-spin mr-2" /> Loading journeys...</div>;
  }

  return (
    <div>
      <PageHeader title="Journeys" subtitle="Visualize the exact path of every lead through your GTM stack." />

      {/* KPI CARDS */}
      <section className="mt-6 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tracked", value: journeys.length, color: "text-white" },
          { label: "Pipeline Active", value: pipelineCount, color: "text-amber-400" },
          { label: "Closed Won", value: wonCount, color: "text-emerald-400" },
          { label: "Attributed Revenue", value: `€${totalMrr}`, color: "text-indigo-400" }
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">{stat.label}</div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </section>

      <div className="flex items-center justify-between px-1 mb-4">
        <h2 className="text-base font-semibold text-slate-100">Live Data Feed</h2>
        <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
           <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
           <span>Real-time updates active</span>
        </div>
      </div>

      {/* JOURNEY LIST */}
      <section className="space-y-4 pb-20">
        {journeys.map((journey, idx) => (
          <JourneyRow key={journey.id} journey={journey} index={idx} />
        ))}

        {journeys.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
            <Layers className="text-slate-700 mb-4" size={48} />
            <p className="text-slate-300 font-medium text-lg">No journeys detected</p>
            <p className="text-slate-500 text-sm mt-2 max-w-md text-center">
              Journeys are created automatically when you create a lead or when data flows in from your integrations.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}