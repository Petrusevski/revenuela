import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import { API_BASE_URL } from "../../config";
import { 
  Zap, X, Loader2, Plus, UserPlus, AlertCircle, 
  Upload, RefreshCw, Mail, Building, Globe, 
  ArrowRight, Map, Share
} from "lucide-react";

// --- TYPES ---

type LeadRow = {
  id: string;
  name: string;
  title: string;
  company: string;
  source: string;
  score: number;
  owner: string;
  status: string;
  journeySteps?: string[]; 
  email?: string;
  linkedin?: string;
};

type IntegrationItem = {
  provider: string;
  status: "connected" | "not_connected";
};

const API_BASE = API_BASE_URL;

// --- COMPONENT: Lead Details Drawer ---

const LeadDetailsDrawer = ({ lead, onClose }: { lead: LeadRow; onClose: () => void }) => {
  const navigate = useNavigate();

  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-950 border-l border-slate-800 h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white">{lead.name}</h2>
            <p className="text-sm text-slate-400 mt-1">{lead.title || "No Title"}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Status */}
          <div className="space-y-3">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</h3>
             {lead.journeySteps && lead.journeySteps.length > 0 ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Active in Journey
                </div>
             ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 text-sm font-medium">
                  Not in Journey
                </div>
             )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Details</h3>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-slate-500">
                <Mail size={16} />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Email</p>
                <p className="text-slate-200">{lead.email || "No email"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-slate-500">
                <Building size={16} />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Company</p>
                <p className="text-slate-200">{lead.company || "Unknown"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-slate-500">
                <Globe size={16} />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Source</p>
                <p className="text-slate-200">{lead.source}</p>
              </div>
            </div>
          </div>

          {/* Journey Path */}
          {lead.journeySteps && lead.journeySteps.length > 0 && (
            <div className="space-y-4">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                 <Map size={14} /> Active Journey Path
               </h3>
               <div className="relative pl-4 border-l-2 border-slate-800 space-y-6">
                  {lead.journeySteps.map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-indigo-500 border-2 border-slate-950 ring-2 ring-indigo-500/20" />
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                        <span className="text-xs text-indigo-400 font-bold mb-1 block">Step {idx + 1}</span>
                        <span className="text-sm font-medium text-white">{step}</span>
                      </div>
                      {idx < (lead.journeySteps?.length || 0) - 1 && (
                         <div className="absolute left-1/2 -bottom-4 text-slate-600">
                           <ArrowRight size={14} className="rotate-90" />
                         </div>
                      )}
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
           <button 
             onClick={() => navigate(`/leads/${lead.id}`)}
             className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-950 font-bold text-sm hover:bg-white transition-colors"
           >
             View Full Profile
           </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: Export to HeyReach Modal ---

// --- COMPONENT: Export to HeyReach Modal ---

const ExportHeyReachModal = ({ workspaceId, onClose }: { workspaceId: string; onClose: () => void }) => {
  const [loading, setLoading] = useState(true); // Start loading immediately
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const getHeaders = () => ({ 
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("revenuela_token")}` 
  });

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        // Try to fetch campaigns using the STORED integration
        const res = await fetch(`${API_BASE}/api/integrations/heyreach/campaigns?workspaceId=${workspaceId}`, { headers: getHeaders() });
        
        if (res.status === 403) {
          // 403 means not connected in backend
          throw new Error("NOT_CONNECTED");
        }
        
        if (!res.ok) throw new Error("Failed to load campaigns.");
        
        const data = await res.json();
        setCampaigns(data.campaigns);
      } catch (e: any) { 
        if (e.message === "NOT_CONNECTED") {
          setError("not_connected");
        } else {
          setError(e.message || "Unknown error");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, [workspaceId]);

  const handleExport = async () => {
    if (!selectedCampaign) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/integrations/heyreach/export`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ workspaceId, campaignId: selectedCampaign }) 
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export failed");
      
      setSuccessMsg(`Successfully sent ${data.count} leads to HeyReach!`);
      setTimeout(onClose, 2000);
    } catch (e: any) {
      alert(e.message); // Simple alert for error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Export to HeyReach</h2>
          <button onClick={onClose}><X className="text-slate-500 hover:text-white" size={20} /></button>
        </div>

        {loading && !successMsg && (
          <div className="py-8 flex flex-col items-center text-slate-400 gap-2">
            <Loader2 className="animate-spin text-indigo-500" size={24} />
            <span className="text-xs">Connecting to HeyReach...</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-xl text-center font-medium border border-emerald-500/20">
            {successMsg}
          </div>
        )}

        {/* ERROR STATE: Not Connected */}
        {!loading && error === "not_connected" && (
          <div className="text-center py-6">
            <div className="inline-flex p-3 rounded-full bg-slate-800 text-slate-400 mb-3">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-white font-medium mb-1">HeyReach Not Connected</h3>
            <p className="text-xs text-slate-400 mb-4 px-4">
              You need to connect your HeyReach account in the Integrations settings before exporting leads.
            </p>
            <button 
              onClick={() => navigate("/integrations")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Go to Integrations
            </button>
          </div>
        )}

        {/* SUCCESS STATE: Campaigns Loaded */}
        {!loading && !error && !successMsg && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">Select a campaign to add leads to:</p>
            
            {campaigns.length === 0 ? (
              <div className="p-4 border border-dashed border-slate-700 rounded-xl text-center text-slate-500 text-xs">
                No active campaigns found in your HeyReach account.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {campaigns.map((c: any) => (
                  <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedCampaign === c.id ? 'bg-indigo-500/10 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
                    <input type="radio" name="campaign" className="hidden" checked={selectedCampaign === c.id} onChange={() => setSelectedCampaign(c.id)} />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedCampaign === c.id ? 'border-indigo-500 bg-indigo-500' : 'border-slate-500'}`}>
                      {selectedCampaign === c.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span className="text-sm text-slate-200">{c.name || "Untitled Campaign"}</span>
                  </label>
                ))}
              </div>
            )}

            <button 
              onClick={handleExport} 
              disabled={!selectedCampaign}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
            >
              Export Leads
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
// --- COMPONENT: Import Leads Modal ---

const ImportLeadsModal = ({ workspaceId, onClose, onSave }: { workspaceId: string, onClose: () => void, onSave: () => void }) => {
  const [mode, setMode] = useState<"csv" | "gsheet">("csv");
  const [file, setFile] = useState<File | null>(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem("revenuela_token");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspaceId", workspaceId);

      const res = await fetch(`${API_BASE}/api/leads/upload-csv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload CSV.");
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleGSheetSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl) return;
    setUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem("revenuela_token");
      const res = await fetch(`${API_BASE}/api/leads/sync-gsheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workspaceId, sheetUrl }),
      });

      if (!res.ok) throw new Error("Failed to sync Sheet.");
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || "Sync failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Upload className="text-indigo-400" size={20} /> Import Leads
          </h2>
          <button onClick={onClose}><X className="text-slate-500 hover:text-white" size={20} /></button>
        </div>

        <div className="flex border-b border-slate-800">
          <button onClick={() => setMode("csv")} className={`flex-1 py-3 text-sm font-medium ${mode === 'csv' ? 'bg-slate-800 text-white border-b-2 border-indigo-500' : 'text-slate-400'}`}>Upload CSV</button>
          <button onClick={() => setMode("gsheet")} className={`flex-1 py-3 text-sm font-medium ${mode === 'gsheet' ? 'bg-slate-800 text-white border-b-2 border-emerald-500' : 'text-slate-400'}`}>Google Sheets</button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-rose-900/20 text-rose-200 rounded-lg text-xs flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}

          {mode === "csv" ? (
            <form onSubmit={handleCsvUpload} className="space-y-4">
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer">
                <Upload className="text-slate-400 mb-3" size={24} />
                <p className="text-sm text-white">{file ? file.name : "Click to browse"}</p>
                <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
              </div>
              <div className="flex justify-end"><button type="submit" disabled={!file || uploading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold">{uploading ? "Uploading..." : "Upload File"}</button></div>
            </form>
          ) : (
            <form onSubmit={handleGSheetSync} className="space-y-4">
              <div className="bg-emerald-900/10 border border-emerald-900/30 p-4 rounded-lg">
                <p className="text-xs text-emerald-200 leading-relaxed">
                  <strong>Note:</strong> Share your sheet with: <br />
                  <code className="bg-black/30 px-1 py-0.5 rounded text-emerald-400 select-all">sync-bot@hypelow.iam.gserviceaccount.com</code>
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Google Sheet URL</label>
                <input type="url" required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} />
              </div>
              <div className="flex justify-end"><button type="submit" disabled={!sheetUrl || uploading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold">{uploading ? "Syncing..." : "Sync Sheet"}</button></div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: New Lead Modal ---
const NewLeadModal = ({ workspaceId, onClose, onSave }: { workspaceId: string, onClose: () => void, onSave: () => void }) => {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", company: "", title: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("revenuela_token");
      const res = await fetch(`${API_BASE}/api/leads`, { 
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, workspaceId })
      });
      if (res.ok) { onSave(); onClose(); } 
      else { alert("Failed to create lead."); }
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><UserPlus size={20} /> New Lead</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="First Name" required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
            <input placeholder="Last Name" required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
          </div>
          <input placeholder="Email" required type="email" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input placeholder="Company" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
          <input placeholder="Job Title" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold">{saving ? "Saving..." : "Create Lead"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- COMPONENT: Create Journey Modal ---
const CreateJourneyModal = ({ lead, workspaceId, onClose, onSave }: { lead: LeadRow; workspaceId: string; onClose: () => void; onSave: () => void; }) => {
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadTools() {
      try {
        const token = localStorage.getItem("revenuela_token");
        const res = await fetch(`${API_BASE}/api/integrations?workspaceId=${workspaceId}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setIntegrations(data.filter((i: any) => i.status === 'connected'));
        setSelectedTools([lead.source]);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    loadTools();
  }, [workspaceId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("revenuela_token");
      await fetch(`${API_BASE}/api/leads/${lead.id}/journey`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ steps: selectedTools })
      });
      onSave(); onClose();
    } catch (e) { alert("Failed to create journey"); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-4">Create Journey</h2>
        {loading ? <Loader2 className="animate-spin text-indigo-500" /> : (
          <div className="space-y-3 mb-6">
            {integrations.map(tool => (
              <label key={tool.provider} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700">
                <input type="checkbox" checked={selectedTools.includes(tool.provider)} onChange={() => {
                  if (selectedTools.includes(tool.provider)) setSelectedTools(selectedTools.filter(t => t !== tool.provider));
                  else setSelectedTools([...selectedTools, tool.provider]);
                }} />
                <span className="text-sm text-slate-200 capitalize">{tool.provider}</span>
              </label>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">Start Journey</button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // Modal States
  const [selectedLeadForJourney, setSelectedLeadForJourney] = useState<LeadRow | null>(null);
  const [viewLead, setViewLead] = useState<LeadRow | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); 
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function getWs() {
      const token = localStorage.getItem("revenuela_token");
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/workspaces/primary`, { headers: { Authorization: `Bearer ${token}` }});
        if (res.ok) { const data = await res.json(); setWorkspaceId(data.id); }
      } catch (e) {}
    }
    getWs();
  }, []);

  const fetchLeads = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("revenuela_token");
      const res = await fetch(`${API_BASE}/api/leads?workspaceId=${encodeURIComponent(workspaceId)}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setLeads(json.leads || []);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchLeads(); }, [workspaceId]);

  const handleRefreshSource = async () => {
    if (!workspaceId) return;
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem("revenuela_token");
      await fetch(`${API_BASE}/api/leads/sync-refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workspaceId }),
      });
      await fetchLeads();
    } catch (e) {} finally { setIsRefreshing(false); }
  };

  const ownerOptions = useMemo(() => Array.from(new Set(leads.map(l => l.owner))).sort(), [leads]);
  const sourceOptions = useMemo(() => Array.from(new Set(leads.map(l => l.source))).sort(), [leads]);
  const statusOptions = useMemo(() => Array.from(new Set(leads.map(l => l.status))).sort(), [leads]);

  const filteredLeads = useMemo(() => leads.filter((l) => {
    if (ownerFilter !== "all" && l.owner !== ownerFilter) return false;
    if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    return true;
  }), [leads, ownerFilter, sourceFilter, statusFilter]);

  return (
    <div>
      <PageHeader title="Leads" subtitle="Manage your top-of-funnel prospects and assign them to GTM journeys." />
      {/* 👇 ADD THIS BLOCK TO FIX THE ERROR 👇 */}
    {error && (
      <div className="mt-4 p-3 bg-rose-900/20 border border-rose-800 text-rose-200 rounded-lg text-sm flex items-center gap-2">
        <AlertCircle size={16} />
        {error}
      </div>
    )}
    {/* 👆 END OF BLOCK 👆 */}
      <div className="my-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
           <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-indigo-500 cursor-pointer" value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
             <option value="all">All Owners</option>
             {ownerOptions.map(o => <option key={o} value={o}>{o}</option>)}
           </select>
           <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-indigo-500 cursor-pointer" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
             <option value="all">All Sources</option>
             {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
           </select>
           <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-indigo-500 cursor-pointer" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
             <option value="all">Any Status</option>
             {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
           </select>
           {loading && <Loader2 className="animate-spin text-slate-500" size={16} />}
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handleRefreshSource} disabled={isRefreshing} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-sm font-medium border border-slate-700">
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} /> {isRefreshing ? "Syncing..." : "Sync"}
          </button>
          <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-sm font-medium border border-slate-700">
            <Share size={16} /> Export
          </button>
          <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700">
            <Upload size={16} /> Import
          </button>
          <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20">
            <Plus size={16} /> New Lead
          </button>
        </div>
      </div>

      <DataTable<LeadRow>
        onRowClick={(row) => setViewLead(row)}
        columns={[
          { key: "id", header: "RVN ID", render: (row) => <span className="font-mono text-[10px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{row.id}</span> },
          { key: "name", header: "Lead", render: (row) => <div><div className="text-slate-100 font-medium">{row.name}</div><div className="text-xs text-slate-400">{row.title}</div></div> },
          { key: "company", header: "Account" },
          { key: "source", header: "Source", render: (row) => <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 border border-slate-700">{row.source}</span> },
          { key: "status", header: "Journey Status", render: (row) => row.journeySteps?.length ? <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">Active</div> : <button onClick={(e) => { e.stopPropagation(); setSelectedLeadForJourney(row); }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 hover:text-white text-slate-400 text-xs border border-slate-700"><Zap size={12} /> Start</button> },
          { key: "owner", header: "Owner" },
        ]}
        data={filteredLeads}
      />

      {viewLead && <LeadDetailsDrawer lead={viewLead} onClose={() => setViewLead(null)} />}
      {selectedLeadForJourney && workspaceId && <CreateJourneyModal lead={selectedLeadForJourney} workspaceId={workspaceId} onClose={() => setSelectedLeadForJourney(null)} onSave={fetchLeads} />}
      {isCreateModalOpen && workspaceId && <NewLeadModal workspaceId={workspaceId} onClose={() => setIsCreateModalOpen(false)} onSave={fetchLeads} />}
      {isImportModalOpen && workspaceId && <ImportLeadsModal workspaceId={workspaceId} onClose={() => setIsImportModalOpen(false)} onSave={fetchLeads} />}
      {isExportModalOpen && workspaceId && <ExportHeyReachModal workspaceId={workspaceId} onClose={() => setIsExportModalOpen(false)} />}
    </div>
  );
}