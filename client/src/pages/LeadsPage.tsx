import { useEffect, useMemo, useState, useRef } from "react";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import { API_BASE_URL } from "../../config";
import { 
  Zap, Check, X, Loader2, Plus, UserPlus, AlertCircle, 
  Upload, FileSpreadsheet, FileText, Download,
  Mail, Building, Globe, ArrowRight, Map 
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
  email?: string; // Added for details view
};

type IntegrationItem = {
  provider: string;
  status: "connected" | "not_connected";
};

const API_BASE = API_BASE_URL;

// --- COMPONENT: Lead Details Drawer (New) ---

const LeadDetailsDrawer = ({ lead, onClose }: { lead: LeadRow; onClose: () => void }) => {
  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-slate-950 border-l border-slate-800 h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white">{lead.name}</h2>
            <p className="text-sm text-slate-400 mt-1">{lead.title || "No Title"}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Status Section */}
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

          {/* Contact Info */}
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

          {/* Active Journey Visualization */}
          {lead.journeySteps && lead.journeySteps.length > 0 && (
            <div className="space-y-4">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                 <Map size={14} /> Active Journey Path
               </h3>
               <div className="relative pl-4 border-l-2 border-slate-800 space-y-6">
                  {lead.journeySteps.map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
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
        
        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
           <button className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-950 font-bold text-sm hover:bg-white transition-colors">
             View Full Profile
           </button>
        </div>
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

      if (!res.ok) throw new Error("Failed to upload CSV. Ensure headers match template.");
      
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
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ workspaceId, sheetUrl }),
      });

      if (!res.ok) throw new Error("Failed to sync Sheet. Is it public or shared with our service account?");
      
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
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Upload className="text-indigo-400" size={20} /> Import Leads
          </h2>
          <button onClick={onClose}><X className="text-slate-500 hover:text-white" size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button 
            onClick={() => setMode("csv")}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'csv' ? 'bg-slate-800 text-white border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <FileText size={16} /> Upload CSV
          </button>
          <button 
            onClick={() => setMode("gsheet")}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'gsheet' ? 'bg-slate-800 text-white border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <FileSpreadsheet size={16} /> Google Sheets
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-900/20 border border-rose-800 text-rose-200 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {mode === "csv" ? (
            <form onSubmit={handleCsvUpload} className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-800/30 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group"
              >
                <div className="h-12 w-12 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 flex items-center justify-center mb-3 transition-colors">
                  <Upload className="text-slate-400 group-hover:text-indigo-400" size={24} />
                </div>
                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-300">Click to browse or drag file here</p>
                    <p className="text-xs text-slate-500 mt-1">Supports .csv files</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".csv" 
                  className="hidden" 
                  onChange={(e) => e.target.files && setFile(e.target.files[0])} 
                />
              </div>

              <div className="flex items-center justify-between">
                <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  <Download size={12} /> Download template
                </a>
                <button 
                  type="submit" 
                  disabled={!file || uploading} 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading ? <Loader2 className="animate-spin" size={14} /> : "Upload File"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleGSheetSync} className="space-y-4">
              <div className="bg-emerald-900/10 border border-emerald-900/30 p-4 rounded-lg">
                <p className="text-xs text-emerald-200 leading-relaxed">
                  <strong>Note:</strong> To connect a sheet, please share it with our service account email: 
                  <br />
                  {/* ✅ CORRECTED EMAIL: */}
                  <code className="bg-black/30 px-1 py-0.5 rounded text-emerald-400 select-all">sync-bot@hypelow.iam.gserviceaccount.com</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Google Sheet URL</label>
                <input 
                  type="url" 
                  required
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none placeholder-slate-600"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-2">
                 <button 
                  type="submit" 
                  disabled={!sheetUrl || uploading} 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading ? <Loader2 className="animate-spin" size={14} /> : "Sync Sheet"}
                </button>
              </div>
            </form>
          )}
        </div>
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
        const res = await fetch(`${API_BASE}/api/integrations?workspaceId=${workspaceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setIntegrations(data.filter((i: any) => i.status === 'connected'));
        
        const defaults = [lead.source];
        if (data.some((i: any) => i.provider === 'hubspot' && i.status === 'connected')) defaults.push('HubSpot');
        if (data.some((i: any) => i.provider === 'stripe' && i.status === 'connected')) defaults.push('Stripe');
        
        setSelectedTools(defaults);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadTools();
  }, [workspaceId, lead.source]);

  const toggleTool = (name: string) => {
    if (selectedTools.includes(name)) {
      setSelectedTools(selectedTools.filter(t => t !== name));
    } else {
      setSelectedTools([...selectedTools, name]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("revenuela_token");
      await fetch(`${API_BASE}/api/leads/${lead.id}/journey`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ steps: selectedTools })
      });
      onSave();
      onClose();
    } catch (e) {
      alert("Failed to create journey");
    } finally {
      setSaving(false);
    }
  };

  const formatName = (p: string) => p.charAt(0).toUpperCase() + p.slice(1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Create Journey</h2>
          <p className="text-sm text-slate-400">Select the active GTM stack for <span className="text-white">{lead.name}</span>.</p>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : (
          <div className="space-y-3 mb-6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Available Tools</div>
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-not-allowed opacity-70">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-white">
                <Check size={12} />
              </div>
              <span className="text-sm font-medium text-slate-200">{lead.source} (Source)</span>
            </label>
            {integrations.length === 0 && (
              <div className="text-sm text-rose-400 bg-rose-950/20 p-3 rounded-lg border border-rose-900/50">
                No connected integrations found. Please connect tools in the Integrations page first.
              </div>
            )}
            {integrations.map((tool) => {
              const name = formatName(tool.provider);
              const isSelected = selectedTools.includes(name);
              if (name.toLowerCase() === lead.source.toLowerCase()) return null;
              return (
                <label key={tool.provider} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'}`}>
                  <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-600 bg-transparent'}`}>
                    {isSelected && <Check size={12} />}
                  </div>
                  <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleTool(name)} />
                  <span className="text-sm font-medium text-slate-200">{name}</span>
                </label>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          <button onClick={handleSave} disabled={saving || loading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            {saving && <Loader2 className="animate-spin" size={14} />}
            Start Journey
          </button>
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
      else { alert("Failed to create lead. Please check the console."); }
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2"><UserPlus className="text-indigo-400" size={20} /> New Lead</h2>
          <button onClick={onClose}><X className="text-slate-500 hover:text-white" size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-slate-400 mb-1">First Name</label><input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} /></div>
            <div><label className="block text-xs font-medium text-slate-400 mb-1">Last Name</label><input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} /></div>
          </div>
          <div><label className="block text-xs font-medium text-slate-400 mb-1">Email</label><input required type="email" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
          <div><label className="block text-xs font-medium text-slate-400 mb-1">Company</label><input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" value={form.company} onChange={e => setForm({...form, company: e.target.value})} /></div>
          <div><label className="block text-xs font-medium text-slate-400 mb-1">Job Title</label><input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={14} /> : "Create Lead"}</button>
          </div>
        </form>
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
  const [selectedLeadForJourney, setSelectedLeadForJourney] = useState<LeadRow | null>(null); // For "Start Journey"
  const [viewLead, setViewLead] = useState<LeadRow | null>(null); // For "View Details" drawer
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); 

  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Load Workspace
  useEffect(() => {
    async function getWs() {
      const token = localStorage.getItem("revenuela_token");
      if (!token) { setError("No auth token found. Please log in."); return; }
      try {
        const res = await fetch(`${API_BASE}/api/workspaces/primary`, { headers: { Authorization: `Bearer ${token}` }});
        if (res.ok) { const data = await res.json(); setWorkspaceId(data.id); }
        else { setError("Could not load workspace."); }
      } catch (e) { setError("Network error connecting to server."); }
    }
    getWs();
  }, []);

  // Load Leads
  const fetchLeads = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("revenuela_token");
      const res = await fetch(`${API_BASE}/api/leads?workspaceId=${encodeURIComponent(workspaceId)}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch leads");
      const json = await res.json();
      setLeads(json.leads || []);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchLeads(); }, [workspaceId]);

  const ownerOptions = useMemo(() => Array.from(new Set(leads.map(l => l.owner))).sort(), [leads]);
  const sourceOptions = useMemo(() => Array.from(new Set(leads.map(l => l.source))).sort(), [leads]);
  const statusOptions = useMemo(() => Array.from(new Set(leads.map(l => l.status))).sort(), [leads]);

  const filteredLeads = useMemo(() => leads.filter((l) => {
    if (ownerFilter !== "all" && l.owner !== ownerFilter) return false;
    if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    return true;
  }), [leads, ownerFilter, sourceFilter, statusFilter]);

  const openNewLeadModal = () => {
    if (!workspaceId) { alert("Error: No Workspace ID found."); return; }
    setIsCreateModalOpen(true);
  };

  const openImportModal = () => { 
    if (!workspaceId) { alert("Error: No Workspace ID found."); return; }
    setIsImportModalOpen(true);
  }

  return (
    <div>
      <PageHeader title="Leads" subtitle="Manage your top-of-funnel prospects and assign them to GTM journeys." />
      {error && <div className="mt-4 p-3 bg-rose-900/20 border border-rose-800 text-rose-200 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

      <div className="my-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-indigo-500 cursor-pointer" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
            <option value="all">All owners</option>
            {ownerOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-indigo-500 cursor-pointer" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="all">All sources</option>
            {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-indigo-500 cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Any Status</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {loading && <Loader2 className="animate-spin text-slate-500" size={16} />}
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={openImportModal} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition-all hover:text-white">
            <Upload size={16} /> Import
          </button>
          <button onClick={openNewLeadModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95">
            <Plus size={16} /> New Lead
          </button>
        </div>
      </div>

      <DataTable<LeadRow>
        onRowClick={(row) => setViewLead(row)}
        columns={[
          {
            key: "id",
            header: "RVN ID",
            render: (row) => (
              <span className="font-mono text-[10px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                {row.id}
              </span>
            ),
          },
          {
            key: "name",
            header: "Lead",
            render: (row) => (
              <div>
                <div className="text-slate-100 font-medium hover:text-indigo-400 transition-colors">{row.name}</div>
                <div className="text-xs text-slate-400">{row.title}</div>
              </div>
            ),
          },
          { key: "company", header: "Account" },
          {
            key: "source",
            header: "Source",
            render: (row) => <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 border border-slate-700">{row.source}</span>,
          },
          {
            key: "status",
            header: "Journey Status",
            render: (row) => {
              if (row.journeySteps && row.journeySteps.length > 0) {
                // ACTIVE STATE
                return (
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-medium text-emerald-400">Active ({row.journeySteps.length})</span>
                  </div>
                );
              }
              // INACTIVE STATE
              return (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setSelectedLeadForJourney(row); 
                  }} 
                  className="group flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-400 transition-all text-xs font-medium border border-slate-700 hover:border-indigo-500"
                >
                  <Zap size={12} className="group-hover:text-yellow-300" /> 
                  Start Journey
                </button>
              );
            }
          },
          { key: "owner", header: "Owner" },
        ]}
        data={filteredLeads}
      />

      {/* DRAWERS & MODALS */}
      {viewLead && (
         <LeadDetailsDrawer lead={viewLead} onClose={() => setViewLead(null)} />
      )}

      {selectedLeadForJourney && workspaceId && ( 
        <CreateJourneyModal 
          lead={selectedLeadForJourney} 
          workspaceId={workspaceId} 
          onClose={() => setSelectedLeadForJourney(null)} 
          onSave={() => fetchLeads()} 
        /> 
      )}
      {isCreateModalOpen && workspaceId && ( <NewLeadModal workspaceId={workspaceId} onClose={() => setIsCreateModalOpen(false)} onSave={() => fetchLeads()} /> )}
      {isImportModalOpen && workspaceId && ( <ImportLeadsModal workspaceId={workspaceId} onClose={() => setIsImportModalOpen(false)} onSave={() => fetchLeads()} /> )} 
    </div>
  );
}