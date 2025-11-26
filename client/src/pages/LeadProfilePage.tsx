import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Mail, Building, Globe, Map, 
  Activity, ShieldCheck, Zap, Clock
} from "lucide-react";
import { API_BASE_URL } from "../../config";

export default function LeadProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const token = localStorage.getItem("revenuela_token");
        const res = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLead(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id]);

  if (loading) return <div className="p-10 text-slate-500">Loading profile...</div>;
  if (!lead) return <div className="p-10 text-slate-500">Lead not found.</div>;

  const journeySteps = lead.journeySteps ? JSON.parse(lead.journeySteps) : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* TOP BAR */}
      <div className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-900 rounded-full text-slate-400 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              {lead.fullName || lead.email}
              {journeySteps.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-medium uppercase tracking-wide">
                  Active
                </span>
              )}
            </h1>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>{lead.id}</span>
              <span className="text-slate-700">•</span>
              <span>Added {new Date(lead.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-all">
            Edit
          </button>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all">
            Actions
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: INTELLIGENCE & DETAILS */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* 1. Score Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap size={14} className="text-amber-400" /> Revenue Intelligence
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-bold text-white mb-1">{lead.intelligence?.engagementScore || 0}</div>
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Engagement Score</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-1">A</div>
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">ICP Fit Grade</div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Open Rate</span>
                <span className="text-slate-200 font-mono">{lead.intelligence?.emailOpenRate || "0%"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Enrichment</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck size={12} /> Complete
                </span>
              </div>
            </div>
          </div>

          {/* 2. Contact Details */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Profile Facts</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-slate-500 mt-0.5" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-slate-500 mb-0.5">Email</p>
                  <p className="text-sm text-slate-200 truncate" title={lead.email}>{lead.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Company</p>
                  <p className="text-sm text-slate-200">{lead.company || "Unknown"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Source</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300">
                    {lead.source || "Manual"}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ACTIVITY & JOURNEY */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* 1. Journey Visualization */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Map size={14} /> Active Journey
              </h3>
              <span className="text-xs text-slate-400">Started {new Date(lead.updatedAt).toLocaleDateString()}</span>
            </div>

            {journeySteps.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {journeySteps.map((step: string, i: number) => (
                  <div key={i} className="flex items-center shrink-0">
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-sm
                        ${i === 0 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 border-slate-700 text-slate-500'}
                      `}>
                        {i + 1}
                      </div>
                      <span className={`text-xs font-medium ${i===0 ? 'text-indigo-300' : 'text-slate-500'}`}>{step}</span>
                    </div>
                    {i < journeySteps.length - 1 && <div className="w-12 h-0.5 bg-slate-800 mb-6 mx-2" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center">
                <Activity className="text-slate-600 mb-2" />
                <p className="text-slate-400 text-sm">No active journey.</p>
                <button className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                  + Start a journey
                </button>
              </div>
            )}
          </div>

          {/* 2. Activity Feed (Timeline) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 min-h-[400px]">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock size={14} /> Timeline & Signals
            </h3>

            <div className="relative pl-6 border-l border-slate-800 space-y-8">
              
              {/* Current Item */}
              <div className="relative">
                <div className="absolute -left-[29px] top-0 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-slate-950/50 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Just now</span>
                  <p className="text-sm text-slate-200">
                    <span className="font-semibold text-white">Lead Profile Viewed</span> by you.
                  </p>
                </div>
              </div>

              {/* Mock History Items */}
              <div className="relative opacity-70">
                <div className="absolute -left-[29px] top-0 w-3 h-3 rounded-full bg-slate-800 border border-slate-600" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">2 hours ago</span>
                  <p className="text-sm text-slate-300">
                    Imported from <span className="text-white font-medium">{lead.source}</span>.
                  </p>
                </div>
              </div>

              <div className="relative opacity-50">
                <div className="absolute -left-[29px] top-0 w-3 h-3 rounded-full bg-slate-800 border border-slate-600" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Yesterday</span>
                  <p className="text-sm text-slate-300">
                    Enrichment signal received: <span className="italic">Valid Email</span>.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}