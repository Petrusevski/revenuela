import { useState, useEffect, useCallback, useRef } from "react";
import { useIntegrations } from "../context/IntegrationsContext";
import PageHeader from "../components/PageHeader";
import { API_BASE_URL } from "../../config";
import {
  Search, Sparkles, Send, Database, CreditCard,
  Plus, CheckCircle2, Trophy, FlaskConical,
  ChevronDown, ChevronRight, X, Zap, BarChart3,
  Clock, Users,
  ArrowRight, Mail, Linkedin, Phone, Trash2, GripVertical,
  AlertCircle, Target, Share2, Check, BookOpen,
} from "lucide-react";
import ABTestingGuide from "../components/ABTestingGuide";

// ─── Types ─────────────────────────────────────────────────────────────────

type ToolCategory = "prospecting" | "enrichment" | "outreach" | "crm" | "billing";

type SequenceStep = {
  id: string;
  day: number;
  channel: "email" | "linkedin" | "call";
  action: string;
  template: string;
};

type FlowNodeType = "trigger" | "prospecting" | "enrichment" | "outreach" | "message" | "delay" | "crm";

type FlowNode = {
  id: string;
  type: FlowNodeType;
  x: number;
  y: number;
  data: {
    tool?: string;
    channel?: "email" | "linkedin" | "call";
    action?: string;
    template?: string;
    day?: number;
    campaignId?: string;
    delayDays?: number;
  };
};

type FlowEdge = { id: string; from: string; to: string };

type StackConfig = {
  id: string;
  name: string;
  tools: Partial<Record<ToolCategory, string>>;
  sequence: SequenceStep[];
  heyreachCampaignId?: string;
  flowNodes?: FlowNode[];
  flowEdges?: FlowEdge[];
};

type ExperimentMetrics = {
  leadsCount: number;
  contacted: number;
  openRate: number;
  replyRate: number;
  meetingRate: number;
  dealRate: number;
  winRate: number;
  revenue: number;
  costPerLead: number;
  avgDaysToReply: number;
  efficiencyScore: number;
};

type Experiment = {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "completed";
  startDate: string;
  endDate?: string;
  audienceSize: number;
  splitPct: number; // % to stack A
  kpis: string[];
  stackA: StackConfig;
  stackB: StackConfig;
  metricsA: ExperimentMetrics;
  metricsB: ExperimentMetrics;
  winner?: "A" | "B" | "tie";
  leadAssignment?: { A: string[]; B: string[] };
};

// ─── Tool Database (matches IntegrationsPage catalog) ──────────────────────

const TOOL_OPTIONS: Record<ToolCategory, { id: string; name: string }[]> = {
  prospecting: [
    { id: "clay",         name: "Clay" },
    { id: "apollo",       name: "Apollo" },
    { id: "lusha",        name: "Lusha" },
    { id: "phantombuster",name: "PhantomBuster" },
    { id: "clearbit_p",   name: "Clearbit" },
  ],
  enrichment: [
    { id: "clearbit", name: "Clearbit" },
    { id: "cognism",  name: "Cognism" },
    { id: "zoominfo", name: "ZoomInfo" },
    { id: "hunter",   name: "Hunter.io" },
    { id: "clay",     name: "Clay" },
  ],
  outreach: [
    { id: "smartlead", name: "Smartlead" },
    { id: "instantly", name: "Instantly" },
    { id: "lemlist",   name: "Lemlist" },
    { id: "heyreach",  name: "HeyReach" },
    { id: "replyio",   name: "Reply.io" },
  ],
  crm: [
    { id: "salesforce", name: "Salesforce" },
    { id: "hubspot",    name: "HubSpot" },
    { id: "pipedrive",  name: "Pipedrive" },
    { id: "attio",      name: "Attio" },
    { id: "airtable",   name: "Airtable" },
  ],
  billing: [
    { id: "stripe",       name: "Stripe" },
    { id: "paddle",       name: "Paddle" },
    { id: "chargebee",    name: "Chargebee" },
    { id: "lemonsqueezy", name: "LemonSqueezy" },
  ],
};

const CAT_CFG: Record<ToolCategory, { icon: any; color: string; bg: string; border: string; label: string }> = {
  prospecting: { icon: Search,     color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/30",    label: "Prospecting" },
  enrichment:  { icon: Sparkles,   color: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/30",  label: "Enrichment" },
  outreach:    { icon: Send,       color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/30",  label: "Outreach" },
  crm:         { icon: Database,   color: "text-indigo-400",  bg: "bg-indigo-500/10",  border: "border-indigo-500/30",  label: "CRM" },
  billing:     { icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Billing" },
};

const CHANNEL_CFG = {
  email:    { icon: Mail,     color: "text-sky-400",    bg: "bg-sky-500/10",    label: "Email" },
  linkedin: { icon: Linkedin, color: "text-blue-400",   bg: "bg-blue-500/10",   label: "LinkedIn" },
  call:     { icon: Phone,    color: "text-amber-400",  bg: "bg-amber-500/10",  label: "Call" },
};

// Which channels each outreach tool supports.
// Tools not listed here allow all channels.
const OUTREACH_CHANNELS: Record<string, Array<"email" | "linkedin" | "call">> = {
  heyreach:  ["linkedin"],
  smartlead: ["email"],
  instantly: ["email"],
  lemlist:   ["email", "linkedin"],
  replyio:   ["email", "linkedin", "call"],
};

const ALL_CHANNELS: Array<"email" | "linkedin" | "call"> = ["email", "linkedin", "call"];

const KPI_OPTIONS = [
  "Reply Rate", "Meeting Booking Rate", "Deal Win Rate",
  "Revenue Generated", "Cost Per Lead", "Time to Reply", "Conversion Rate",
];

// ─── Lead Types ────────────────────────────────────────────────────────────

type Lead = {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  companySize: string;
  source: string;
};

function mapApiLead(l: any): Lead | null {
  if (!l?.id) return null;
  return {
    id: l.id,
    name: l.name || l.fullName || "Unknown",
    title: l.title || l.jobTitle || l.contact?.jobTitle || "",
    company: l.company || l.account?.name || "",
    industry: l.industry || l.account?.industry || "Other",
    companySize: l.companySize || "51-200",
    source: l.source || "manual",
  };
}

const INDUSTRY_COLORS: Record<string, string> = {
  SaaS:        "text-indigo-300 bg-indigo-500/10 border-indigo-500/30",
  FinTech:     "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  HealthTech:  "text-rose-300 bg-rose-500/10 border-rose-500/30",
  "E-commerce":"text-amber-300 bg-amber-500/10 border-amber-500/30",
  Enterprise:  "text-sky-300 bg-sky-500/10 border-sky-500/30",
  Consulting:  "text-purple-300 bg-purple-500/10 border-purple-500/30",
  Marketing:   "text-orange-300 bg-orange-500/10 border-orange-500/30",
};

const SOURCE_COLORS: Record<string, string> = {
  clay:         "text-cyan-300 bg-cyan-500/10 border-cyan-500/30",
  apollo:       "text-violet-300 bg-violet-500/10 border-violet-500/30",
  lusha:        "text-blue-300 bg-blue-500/10 border-blue-500/30",
  phantombuster:"text-orange-300 bg-orange-500/10 border-orange-500/30",
  clearbit_p:   "text-teal-300 bg-teal-500/10 border-teal-500/30",
  zoominfo:     "text-sky-300 bg-sky-500/10 border-sky-500/30",
  pdl:          "text-indigo-300 bg-indigo-500/10 border-indigo-500/30",
  hunter:       "text-amber-300 bg-amber-500/10 border-amber-500/30",
};

const SOURCE_LABELS: Record<string, string> = {
  clay: "Clay", apollo: "Apollo", lusha: "Lusha",
  phantombuster: "PhantomBuster", clearbit_p: "Clearbit",
  zoominfo: "ZoomInfo", pdl: "PDL", hunter: "Hunter",
};

/* Experiments are loaded from /api/experiments in ABTestingPage */

// ─── Helpers ───────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }


function MetricRow({ label, a, b, format = "pct", higherIsBetter = true }:
  { label: string; a: number; b: number; format?: "pct" | "number" | "currency" | "days"; higherIsBetter?: boolean }) {
  const fmt = (v: number) => {
    if (format === "pct")      return `${v}%`;
    if (format === "currency") return `$${v.toLocaleString()}`;
    if (format === "days")     return `${v}d`;
    return v.toLocaleString();
  };
  const aWins = higherIsBetter ? a > b : a < b;
  const bWins = higherIsBetter ? b > a : b < a;
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2 py-2 border-b border-slate-800/60 last:border-0">
      <div className={`text-sm font-semibold text-right tabular-nums ${aWins ? "text-white" : "text-slate-400"}`}>{fmt(a)}</div>
      <div className={`w-2 h-2 rounded-full ${aWins ? "bg-indigo-400" : "bg-transparent"}`} />
      <div className="text-[11px] text-slate-400 text-center px-3 min-w-[120px]">{label}</div>
      <div className={`w-2 h-2 rounded-full ${bWins ? "bg-emerald-400" : "bg-transparent"}`} />
      <div className={`text-sm font-semibold tabular-nums ${bWins ? "text-white" : "text-slate-400"}`}>{fmt(b)}</div>
    </div>
  );
}

function FunnelBar({ label, pct, color, count }: { label: string; pct: number; color: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-[10px] text-slate-500 w-20 text-right shrink-0">{label}</div>
      <div className="flex-1 h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div className={`h-full rounded-full ${color} opacity-80 transition-all duration-500`} style={{ width: `${Math.max(pct, 1)}%` }} />
      </div>
      <div className="text-[11px] text-slate-300 font-mono w-10 shrink-0">{pct}%</div>
      <div className="text-[10px] text-slate-600 font-mono w-8 shrink-0">{count}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Experiment["status"] }) {
  const cfg = {
    draft:     { label: "Draft",     class: "bg-slate-700/40 text-slate-300 border-slate-600/40" },
    active:    { label: "Active",    class: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 animate-pulse" },
    paused:    { label: "Paused",    class: "bg-amber-500/10 text-amber-300 border-amber-500/30" },
    completed: { label: "Completed", class: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30" },
  }[status];
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.class}`}>{cfg.label}</span>;
}

function StackBadge({ stack, side }: { stack: StackConfig; side: "A" | "B" }) {
  const color = side === "A" ? "text-indigo-300 bg-indigo-500/10 border-indigo-500/30" : "text-emerald-300 bg-emerald-500/10 border-emerald-500/30";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${color}`}>
      <span className={`w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold ${side === "A" ? "bg-indigo-500" : "bg-emerald-500"} text-white`}>{side}</span>
      {stack.name}
    </span>
  );
}

// ─── Stack Builder Sub-Component ───────────────────────────────────────────

function StackBuilder({ value, onChange, label, colorClass, workspaceId }: {
  value: StackConfig; onChange: (s: StackConfig) => void; label: string; colorClass: string; workspaceId?: string | null;
}) {
  const { connectedTools } = useIntegrations();
  const dragIdxRef = useRef<number>(-1);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [heyreachCampaigns, setHeyreachCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [hrCampaignsLoading, setHrCampaignsLoading] = useState(false);

  // Derive allowed channels from the selected outreach tool
  const selectedOutreach = value.tools.outreach ?? "";
  const allowedChannels: Array<"email" | "linkedin" | "call"> =
    OUTREACH_CHANNELS[selectedOutreach] ?? ALL_CHANNELS;
  const outreachToolName = TOOL_OPTIONS.outreach.find(t => t.id === selectedOutreach)?.name;

  // When the outreach tool changes, fix any steps whose channel is no longer valid
  useEffect(() => {
    const needsFix = value.sequence.some(s => !allowedChannels.includes(s.channel));
    if (needsFix) {
      onChange({
        ...value,
        sequence: value.sequence.map(s =>
          allowedChannels.includes(s.channel) ? s : { ...s, channel: allowedChannels[0] }
        ),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOutreach]);

  // Fetch HeyReach campaigns when HeyReach is selected as outreach tool
  useEffect(() => {
    if (selectedOutreach !== "heyreach" || !workspaceId) return;
    setHrCampaignsLoading(true);
    fetch(`${API_BASE_URL}/api/integrations/heyreach/campaigns?workspaceId=${workspaceId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setHeyreachCampaigns(
        (d.campaigns ?? []).map((c: any) => ({ id: String(c.id ?? c.campaignId ?? ""), name: c.name ?? c.campaignName ?? "Unnamed" }))
      ))
      .catch(() => setHeyreachCampaigns([]))
      .finally(() => setHrCampaignsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOutreach, workspaceId]);

  const addStep = () => {
    const newStep: SequenceStep = {
      id: uid(), day: (value.sequence.at(-1)?.day ?? 0) + 3,
      channel: allowedChannels[0], action: "", template: "",
    };
    onChange({ ...value, sequence: [...value.sequence, newStep] });
  };
  const removeStep = (id: string) => onChange({ ...value, sequence: value.sequence.filter(s => s.id !== id) });
  const updateStep = (id: string, patch: Partial<SequenceStep>) =>
    onChange({ ...value, sequence: value.sequence.map(s => s.id === id ? { ...s, ...patch } : s) });

  const handleDragStart = (idx: number) => { dragIdxRef.current = idx; };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOver(idx);
  };
  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    const fromIdx = dragIdxRef.current;
    if (fromIdx < 0 || fromIdx === toIdx) { setDragOver(null); return; }
    const next = [...value.sequence];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onChange({ ...value, sequence: next });
    dragIdxRef.current = -1;
    setDragOver(null);
  };
  const handleDragEnd = () => { dragIdxRef.current = -1; setDragOver(null); };

  return (
    <div className={`rounded-2xl border p-5 ${colorClass}`}>
      {/* Stack Name */}
      <div className="flex items-center gap-3 mb-5">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${colorClass} uppercase tracking-wider`}>{label}</span>
        <input
          type="text"
          placeholder="Stack name (e.g. Clay + Lemlist)"
          value={value.name}
          onChange={e => onChange({ ...value, name: e.target.value })}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>

      {/* Tool Selection */}
      <div className="mb-5">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Select Tools per Category</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(Object.keys(CAT_CFG) as ToolCategory[]).map(cat => {
            const cfg = CAT_CFG[cat];
            const Icon = cfg.icon;
            const available = TOOL_OPTIONS[cat].filter(t => connectedTools.has(t.id));
            const noneConnected = available.length === 0;
            return (
              <div key={cat} className={`flex items-center gap-2 p-2.5 rounded-xl border ${noneConnected ? "border-slate-700/40 opacity-50" : cfg.border} bg-slate-950`}>
                <div className={`p-1.5 rounded-lg ${cfg.bg} shrink-0`}>
                  <Icon size={12} className={cfg.color} />
                </div>
                <select
                  value={value.tools[cat] ?? ""}
                  disabled={noneConnected}
                  onChange={e => onChange({ ...value, tools: { ...value.tools, [cat]: e.target.value || undefined } })}
                  className="flex-1 bg-slate-950 text-xs text-slate-200 focus:outline-none cursor-pointer min-w-0 disabled:cursor-not-allowed"
                >
                  {noneConnected
                    ? <option value="">Not connected</option>
                    : <>
                        <option value="">{cfg.label} (optional)</option>
                        {available.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </>
                  }
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* HeyReach campaign picker */}
      {selectedOutreach === "heyreach" && (
        <div className="mb-5 p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
          <div className="text-[10px] text-indigo-400 uppercase tracking-wider mb-2 font-semibold">HeyReach Campaign</div>
          {hrCampaignsLoading
            ? <p className="text-xs text-slate-500">Loading campaigns…</p>
            : heyreachCampaigns.length === 0
              ? <p className="text-xs text-slate-500">No campaigns found. Create one in HeyReach first.</p>
              : <select
                  value={value.heyreachCampaignId ?? ""}
                  onChange={e => onChange({ ...value, heyreachCampaignId: e.target.value || undefined })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                >
                  <option value="">— Select campaign —</option>
                  {heyreachCampaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
          }
          {value.heyreachCampaignId && (
            <p className="text-[10px] text-indigo-400/70 mt-1.5">Contacts assigned to this stack will be pushed into this campaign when you launch.</p>
          )}
        </div>
      )}

      {/* Sequence Builder */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Outreach Sequence</div>
          {outreachToolName && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
              {allowedChannels.map(ch => {
                const Icon = CHANNEL_CFG[ch].icon;
                return <Icon key={ch} size={10} className={CHANNEL_CFG[ch].color} />;
              })}
              <span>{outreachToolName} — {allowedChannels.map(ch => CHANNEL_CFG[ch].label).join(" + ")} only</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {value.sequence.map((step, idx) => {
            const chCfg = CHANNEL_CFG[step.channel];
            const ChIcon = chCfg.icon;
            const isOver = dragOver === idx;
            return (
              <div
                key={step.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDrop={e => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-start gap-2 p-3 rounded-xl border transition-all ${
                  isOver
                    ? "bg-indigo-500/10 border-indigo-500/50 scale-[1.01]"
                    : "bg-slate-950 border-slate-800"
                }`}
              >
                <div className="flex items-center gap-1 shrink-0 mt-1 cursor-grab active:cursor-grabbing">
                  <GripVertical size={13} className="text-slate-500" />
                  <span className="text-[10px] text-slate-600 font-mono w-6 text-center">{idx + 1}</span>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-[80px_110px_1fr] gap-2">
                  {/* Day */}
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-slate-500 shrink-0" />
                    <input
                      type="number"
                      min={1}
                      value={step.day}
                      onChange={e => updateStep(step.id, { day: +e.target.value })}
                      className="w-12 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">day</span>
                  </div>

                  {/* Channel */}
                  <div className="flex items-center gap-1.5">
                    <div className={`p-1 rounded ${chCfg.bg}`}>
                      <ChIcon size={11} className={chCfg.color} />
                    </div>
                    <select
                      value={step.channel}
                      onChange={e => updateStep(step.id, { channel: e.target.value as any })}
                      disabled={allowedChannels.length === 1}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none disabled:opacity-70 disabled:cursor-default"
                    >
                      {allowedChannels.map(ch => (
                        <option key={ch} value={ch}>{CHANNEL_CFG[ch].label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Action */}
                  <input
                    type="text"
                    placeholder="Action name (e.g. Initial outreach)"
                    value={step.action}
                    onChange={e => updateStep(step.id, { action: e.target.value })}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                  />

                  {/* Template */}
                  <div className="sm:col-span-3">
                    <textarea
                      rows={2}
                      placeholder="Message template (use {{first_name}}, {{company}}, etc.)"
                      value={step.template}
                      onChange={e => updateStep(step.id, { template: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 placeholder-slate-600 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <button onClick={() => removeStep(step.id)} className="text-slate-600 hover:text-rose-400 transition-colors shrink-0 mt-1">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
        <button
          onClick={addStep}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-slate-700 text-xs text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all"
        >
          <Plus size={13} /> Add step
        </button>
      </div>
    </div>
  );
}

// ─── Flow Canvas ───────────────────────────────────────────────────────────

const NODE_W = 210;
const NODE_HEADER_H = 36;

const FLOW_NODE_CFG: Record<FlowNodeType, { label: string; color: string; headerBg: string; border: string; dot: string }> = {
  trigger:     { label: "Start",       color: "text-slate-200",  headerBg: "bg-slate-700",        border: "border-slate-500",     dot: "bg-slate-400" },
  prospecting: { label: "Prospecting", color: "text-cyan-200",   headerBg: "bg-cyan-500/25",      border: "border-cyan-500/50",   dot: "bg-cyan-400" },
  enrichment:  { label: "Enrichment",  color: "text-purple-200", headerBg: "bg-purple-500/25",    border: "border-purple-500/50", dot: "bg-purple-400" },
  outreach:    { label: "Outreach",    color: "text-orange-200", headerBg: "bg-orange-500/25",    border: "border-orange-500/50", dot: "bg-orange-400" },
  message:     { label: "Message",     color: "text-sky-200",    headerBg: "bg-sky-500/25",       border: "border-sky-500/50",    dot: "bg-sky-400" },
  delay:       { label: "Delay",       color: "text-amber-200",  headerBg: "bg-amber-500/25",     border: "border-amber-500/50",  dot: "bg-amber-400" },
  crm:         { label: "CRM",         color: "text-indigo-200", headerBg: "bg-indigo-500/25",    border: "border-indigo-500/50", dot: "bg-indigo-400" },
};

const ADD_NODE_TYPES: FlowNodeType[] = ["prospecting", "enrichment", "outreach", "message", "delay", "crm"];

function initFlowNodes(stack: StackConfig): FlowNode[] {
  if (stack.flowNodes && stack.flowNodes.length > 0) return stack.flowNodes;
  const nodes: FlowNode[] = [
    { id: "trigger-" + stack.id, type: "trigger", x: 40, y: 120, data: {} },
  ];
  let xi = 280;
  if (stack.tools.prospecting) {
    nodes.push({ id: uid(), type: "prospecting", x: xi, y: 40, data: { tool: stack.tools.prospecting } });
  }
  if (stack.tools.enrichment) {
    nodes.push({ id: uid(), type: "enrichment", x: xi, y: 180, data: { tool: stack.tools.enrichment } });
  }
  xi = 530;
  if (stack.tools.outreach) {
    nodes.push({ id: uid(), type: "outreach", x: xi, y: 100, data: { tool: stack.tools.outreach, campaignId: stack.heyreachCampaignId } });
  }
  xi = 780;
  stack.sequence.forEach((step, i) => {
    nodes.push({ id: step.id, type: "message", x: xi, y: i * 160, data: { channel: step.channel, action: step.action, template: step.template, day: step.day } });
  });
  if (stack.tools.crm) {
    nodes.push({ id: uid(), type: "crm", x: xi + 260, y: 80, data: { tool: stack.tools.crm } });
  }
  return nodes;
}

function deriveFromFlow(nodes: FlowNode[], edges: FlowEdge[], base: StackConfig): StackConfig {
  const tools: Partial<Record<ToolCategory, string>> = {};
  let heyreachCampaignId: string | undefined;
  const sequence: SequenceStep[] = [];
  for (const n of nodes) {
    if (n.type === "prospecting" && n.data.tool) tools.prospecting = n.data.tool;
    if (n.type === "enrichment"  && n.data.tool) tools.enrichment  = n.data.tool;
    if (n.type === "outreach"    && n.data.tool) {
      tools.outreach = n.data.tool;
      if (n.data.tool === "heyreach" && n.data.campaignId) heyreachCampaignId = n.data.campaignId;
    }
    if (n.type === "crm" && n.data.tool) tools.crm = n.data.tool;
    if (n.type === "message") {
      sequence.push({ id: n.id, day: n.data.day ?? 1, channel: n.data.channel ?? "email", action: n.data.action ?? "", template: n.data.template ?? "" });
    }
  }
  sequence.sort((a, b) => a.day - b.day);
  return { ...base, tools, sequence, heyreachCampaignId, flowNodes: nodes, flowEdges: edges };
}

function FlowCanvas({ value, onChange, label, colorClass, workspaceId }: {
  value: StackConfig; onChange: (s: StackConfig) => void; label: string; colorClass: string; workspaceId?: string | null;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef   = useRef<{ nodeId: string; startMouseX: number; startMouseY: number; origX: number; origY: number } | null>(null);
  const [nodes, setNodes] = useState<FlowNode[]>(() => initFlowNodes(value));
  const [edges, setEdges] = useState<FlowEdge[]>(() => value.flowEdges ?? []);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos]       = useState({ x: 0, y: 0 });
  const [heyreachCampaigns, setHrCampaigns] = useState<{ id: string; name: string }[]>([]);

  const outreachNode = nodes.find(n => n.type === "outreach");
  const selectedOutreach = outreachNode?.data.tool ?? "";

  useEffect(() => {
    if (selectedOutreach !== "heyreach" || !workspaceId) return;
    fetch(`${API_BASE_URL}/api/integrations/heyreach/campaigns?workspaceId=${workspaceId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setHrCampaigns((d.campaigns ?? []).map((c: any) => ({ id: String(c.id ?? c.campaignId ?? ""), name: c.name ?? c.campaignName ?? "Unnamed" }))))
      .catch(() => setHrCampaigns([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOutreach, workspaceId]);

  // Mouse drag handlers
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left + canvasRef.current.scrollLeft;
      const my = e.clientY - rect.top  + canvasRef.current.scrollTop;
      setMousePos({ x: mx, y: my });
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startMouseX;
      const dy = e.clientY - dragRef.current.startMouseY;
      setNodes(prev => prev.map(n => n.id === dragRef.current!.nodeId
        ? { ...n, x: Math.max(0, dragRef.current!.origX + dx), y: Math.max(0, dragRef.current!.origY + dy) }
        : n
      ));
    };
    const onUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        setNodes(prev => { onChange(deriveFromFlow(prev, edges, value)); return prev; });
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges, value]);

  const commit = (nextNodes: FlowNode[], nextEdges: FlowEdge[]) => {
    setNodes(nextNodes); setEdges(nextEdges);
    onChange(deriveFromFlow(nextNodes, nextEdges, value));
  };

  const updateNodeData = (id: string, patch: Partial<FlowNode["data"]>) => {
    const next = nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n);
    commit(next, edges);
  };

  const addNode = (type: FlowNodeType) => {
    const maxX = nodes.reduce((m, n) => Math.max(m, n.x), 0);
    const newNode: FlowNode = { id: uid(), type, x: maxX + 260, y: 100, data: {} };
    commit([...nodes, newNode], edges);
  };

  const removeNode = (id: string) => {
    commit(nodes.filter(n => n.id !== id), edges.filter(e => e.from !== id && e.to !== id));
  };

  const handleOutputPortClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setPendingFrom(nodeId);
  };

  const handleInputPortClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (!pendingFrom || pendingFrom === nodeId) { setPendingFrom(null); return; }
    if (edges.find(ed => ed.from === pendingFrom && ed.to === nodeId)) { setPendingFrom(null); return; }
    const nextEdges = [...edges, { id: uid(), from: pendingFrom, to: nodeId }];
    setEdges(nextEdges);
    onChange(deriveFromFlow(nodes, nextEdges, value));
    setPendingFrom(null);
  };

  const getPortPos = (nodeId: string, side: "out" | "in") => {
    const n = nodes.find(x => x.id === nodeId);
    if (!n) return { x: 0, y: 0 };
    return side === "out"
      ? { x: n.x + NODE_W, y: n.y + NODE_HEADER_H / 2 }
      : { x: n.x,           y: n.y + NODE_HEADER_H / 2 };
  };

  const canvasW = Math.max(1100, nodes.reduce((m, n) => Math.max(m, n.x + NODE_W + 60), 0));
  const canvasH = Math.max(600,  nodes.reduce((m, n) => Math.max(m, n.y + 240), 0));

  return (
    <div className={`rounded-2xl border p-4 ${colorClass} space-y-3`}>
      {/* Stack Name */}
      <div className="flex items-center gap-3">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${colorClass} uppercase tracking-wider shrink-0`}>{label}</span>
        <input
          type="text" placeholder="Stack name"
          value={value.name} onChange={e => onChange({ ...value, name: e.target.value })}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>

      {/* Add node toolbar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Add node:</span>
        {ADD_NODE_TYPES.map(t => {
          const cfg = FLOW_NODE_CFG[t];
          return (
            <button key={t} onClick={() => addNode(t)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${cfg.border} ${cfg.color} bg-slate-950 hover:bg-slate-800 transition-all`}>
              <Plus size={9} /> {cfg.label}
            </button>
          );
        })}
        {pendingFrom && (
          <span className="ml-2 px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-[10px] text-indigo-300 animate-pulse">
            Click an input port to connect →
          </span>
        )}
        {pendingFrom && (
          <button onClick={() => setPendingFrom(null)} className="text-[10px] text-slate-500 hover:text-slate-300 transition-all">Cancel</button>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative overflow-auto rounded-xl border border-slate-800 bg-slate-950 cursor-default select-none"
        style={{ height: 480 }}
        onMouseMove={e => {
          if (pendingFrom && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            setMousePos({ x: e.clientX - rect.left + canvasRef.current.scrollLeft, y: e.clientY - rect.top + canvasRef.current.scrollTop });
          }
        }}
        onClick={() => setPendingFrom(null)}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, #334155 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />

        {/* SVG overlay for edges */}
        <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ width: canvasW, height: canvasH }}>
          <defs>
            <marker id={`arr-${value.id}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#6366f1" />
            </marker>
          </defs>
          {edges.map(ed => {
            const from = getPortPos(ed.from, "out");
            const to   = getPortPos(ed.to,   "in");
            const cx   = (from.x + to.x) / 2;
            return (
              <g key={ed.id}>
                <path
                  d={`M ${from.x},${from.y} C ${cx},${from.y} ${cx},${to.y} ${to.x},${to.y}`}
                  fill="none" stroke="#6366f1" strokeWidth="1.8" strokeOpacity="0.7"
                  markerEnd={`url(#arr-${value.id})`}
                />
                <path
                  d={`M ${from.x},${from.y} C ${cx},${from.y} ${cx},${to.y} ${to.x},${to.y}`}
                  fill="none" stroke="#a5b4fc" strokeWidth="4" strokeOpacity="0.08"
                />
                {/* Delete edge */}
                <circle cx={(from.x + to.x) / 2} cy={(from.y + to.y) / 2} r="7" fill="#1e293b" stroke="#475569" strokeWidth="1"
                  className="pointer-events-auto cursor-pointer hover:fill-rose-900"
                  onClick={e => { e.stopPropagation(); const ne = edges.filter(x => x.id !== ed.id); setEdges(ne); onChange(deriveFromFlow(nodes, ne, value)); }}
                />
                <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 + 4} textAnchor="middle" fontSize="9" fill="#94a3b8"
                  className="pointer-events-none">✕</text>
              </g>
            );
          })}
          {/* Pending edge line */}
          {pendingFrom && (() => {
            const from = getPortPos(pendingFrom, "out");
            return <path d={`M ${from.x},${from.y} C ${(from.x + mousePos.x)/2},${from.y} ${(from.x + mousePos.x)/2},${mousePos.y} ${mousePos.x},${mousePos.y}`}
              fill="none" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="5,3" strokeOpacity="0.7" />;
          })()}
        </svg>

        {/* Nodes */}
        <div style={{ width: canvasW, height: canvasH, position: "relative" }}>
          {nodes.map(node => {
            const cfg = FLOW_NODE_CFG[node.type];
            const isTrigger = node.type === "trigger";
            const allowedCh = node.type === "message" && nodes.find(n => n.type === "outreach")?.data.tool
              ? (OUTREACH_CHANNELS[nodes.find(n => n.type === "outreach")!.data.tool!] ?? ALL_CHANNELS)
              : ALL_CHANNELS;

            return (
              <div
                key={node.id}
                className={`absolute rounded-xl border bg-slate-900 shadow-xl ${cfg.border}`}
                style={{ left: node.x, top: node.y, width: NODE_W, zIndex: 10 }}
              >
                {/* Header — drag handle */}
                <div
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-t-xl cursor-grab active:cursor-grabbing ${cfg.headerBg}`}
                  onMouseDown={e => {
                    e.preventDefault();
                    dragRef.current = { nodeId: node.id, startMouseX: e.clientX, startMouseY: e.clientY, origX: node.x, origY: node.y };
                  }}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <span className={`text-[11px] font-semibold flex-1 ${cfg.color}`}>{cfg.label}</span>
                  {!isTrigger && (
                    <button onClick={() => removeNode(node.id)} className="text-slate-600 hover:text-rose-400 transition-colors p-0.5">
                      <X size={11} />
                    </button>
                  )}
                </div>

                {/* Config body */}
                <div className="px-2.5 py-2 space-y-1.5 text-[11px]">
                  {/* Tool nodes */}
                  {(node.type === "prospecting" || node.type === "enrichment" || node.type === "outreach" || node.type === "crm") && (() => {
                    const cat = node.type === "outreach" ? "outreach" : node.type === "crm" ? "crm" : node.type === "prospecting" ? "prospecting" : "enrichment";
                    return (
                      <select value={node.data.tool ?? ""} onChange={e => updateNodeData(node.id, { tool: e.target.value || undefined })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none">
                        <option value="">— Select tool —</option>
                        {TOOL_OPTIONS[cat].map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    );
                  })()}

                  {/* HeyReach campaign picker */}
                  {node.type === "outreach" && node.data.tool === "heyreach" && (
                    <select value={node.data.campaignId ?? ""} onChange={e => updateNodeData(node.id, { campaignId: e.target.value || undefined })}
                      className="w-full bg-slate-800 border border-indigo-500/30 rounded-lg px-2 py-1 text-[11px] text-indigo-200 focus:outline-none">
                      <option value="">— HeyReach campaign —</option>
                      {heyreachCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}

                  {/* Message node */}
                  {node.type === "message" && (
                    <>
                      <div className="flex gap-1.5">
                        <input type="number" min={1} value={node.data.day ?? 1}
                          onChange={e => updateNodeData(node.id, { day: +e.target.value })}
                          className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-200 focus:outline-none" placeholder="Day" />
                        <select value={node.data.channel ?? "email"} onChange={e => updateNodeData(node.id, { channel: e.target.value as any })}
                          disabled={allowedCh.length === 1}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-200 focus:outline-none disabled:opacity-70">
                          {allowedCh.map(ch => <option key={ch} value={ch}>{CHANNEL_CFG[ch].label}</option>)}
                        </select>
                      </div>
                      <input type="text" placeholder="Action name" value={node.data.action ?? ""}
                        onChange={e => updateNodeData(node.id, { action: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none" />
                      <textarea rows={2} placeholder="Message template…" value={node.data.template ?? ""}
                        onChange={e => updateNodeData(node.id, { template: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none resize-none" />
                    </>
                  )}

                  {/* Delay node */}
                  {node.type === "delay" && (
                    <div className="flex items-center gap-2">
                      <Clock size={11} className="text-amber-400 shrink-0" />
                      <input type="number" min={1} value={node.data.delayDays ?? 3}
                        onChange={e => updateNodeData(node.id, { delayDays: +e.target.value })}
                        className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-200 focus:outline-none" />
                      <span className="text-slate-500">days</span>
                    </div>
                  )}

                  {/* Trigger node */}
                  {isTrigger && <p className="text-slate-500 text-[10px] py-1">Experiment begins here</p>}
                </div>

                {/* Ports */}
                {/* Input port (left) */}
                {!isTrigger && (
                  <div
                    className={`absolute w-3 h-3 rounded-full border-2 cursor-pointer transition-all ${pendingFrom ? "bg-indigo-400 border-indigo-300 scale-125" : "bg-slate-700 border-slate-500 hover:bg-indigo-500 hover:border-indigo-300"}`}
                    style={{ left: -7, top: NODE_HEADER_H / 2 - 6 }}
                    onClick={e => handleInputPortClick(e, node.id)}
                  />
                )}
                {/* Output port (right) */}
                <div
                  className={`absolute w-3 h-3 rounded-full border-2 cursor-pointer transition-all ${pendingFrom === node.id ? "bg-indigo-400 border-indigo-300 scale-125" : "bg-slate-700 border-slate-500 hover:bg-indigo-500 hover:border-indigo-300"}`}
                  style={{ right: -7, top: NODE_HEADER_H / 2 - 6 }}
                  onClick={e => handleOutputPortClick(e, node.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Lead Assignment Components ────────────────────────────────────────────

function LeadMiniCard({ lead, inStack, onMoveA, onMoveB, onRemove }: {
  lead: Lead;
  inStack: "pool" | "A" | "B";
  onMoveA?: () => void;
  onMoveB?: () => void;
  onRemove?: () => void;
}) {
  const initials = lead.name.split(" ").map(w => w[0]).join("").slice(0, 2);
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group">
      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-slate-100 truncate">{lead.name}</div>
        <div className="text-[10px] text-slate-500 truncate">{lead.company}</div>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          <span className={`text-[8px] px-1 py-0.5 rounded border ${INDUSTRY_COLORS[lead.industry] ?? "text-slate-400 bg-slate-800 border-slate-700"}`}>{lead.industry}</span>
          <span className={`text-[8px] px-1 py-0.5 rounded border ${SOURCE_COLORS[lead.source]}`}>{SOURCE_LABELS[lead.source]}</span>
          <span className="text-[8px] px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-500">{lead.companySize}</span>
        </div>
      </div>
      {inStack === "pool" ? (
        <div className="flex flex-col gap-1 shrink-0">
          <button onClick={onMoveA} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 transition-all">A</button>
          <button onClick={onMoveB} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 transition-all">B</button>
        </div>
      ) : (
        <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-rose-400 transition-all shrink-0">
          <X size={10} />
        </button>
      )}
    </div>
  );
}

function AudienceManager({ splitPct, stackAName, stackBName, assignment, onAssign, leads }: {
  splitPct: number;
  stackAName: string;
  stackBName: string;
  assignment: { A: string[]; B: string[] };
  onAssign: (a: { A: string[]; B: string[] }) => void;
  leads: Lead[];
}) {
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Use all stored contacts — no tool-connection filter
  const ALL_LEADS = leads;
  const hasLeads  = ALL_LEADS.length > 0;
  const noLeads   = ALL_LEADS.length === 0;

  const assigned   = new Set([...assignment.A, ...assignment.B]);
  const industries = Array.from(new Set(ALL_LEADS.map(l => l.industry)));
  const allSources = Array.from(new Set(ALL_LEADS.map(l => l.source)));

  const matchesFilter = (l: Lead) => {
    const q = search.toLowerCase();
    if (q && !l.name.toLowerCase().includes(q) && !l.company.toLowerCase().includes(q)) return false;
    if (industryFilter !== "all" && l.industry !== industryFilter) return false;
    if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
    return true;
  };

  const pool        = ALL_LEADS.filter(l => !assigned.has(l.id) && matchesFilter(l));
  const stackALeads = ALL_LEADS.filter(l => assignment.A.includes(l.id));
  const stackBLeads = ALL_LEADS.filter(l => assignment.B.includes(l.id));

  const move = (id: string, to: "A" | "B") => onAssign({
    A: to === "A" ? [...assignment.A.filter(i => i !== id), id] : assignment.A.filter(i => i !== id),
    B: to === "B" ? [...assignment.B.filter(i => i !== id), id] : assignment.B.filter(i => i !== id),
  });

  const unassign = (id: string) => onAssign({
    A: assignment.A.filter(i => i !== id),
    B: assignment.B.filter(i => i !== id),
  });

  const autoSplit = () => {
    const unassignedAll = ALL_LEADS.filter(l => !assigned.has(l.id));
    const shuffled = [...unassignedAll].sort(() => Math.random() - 0.5);
    const cut = Math.round(shuffled.length * splitPct / 100);
    onAssign({
      A: [...assignment.A, ...shuffled.slice(0, cut).map(l => l.id)],
      B: [...assignment.B, ...shuffled.slice(cut).map(l => l.id)],
    });
  };

  const bulkAssign = (field: "industry" | "source", value: string, stack: "A" | "B") => {
    const ids = ALL_LEADS.filter(l => l[field] === value && !assigned.has(l.id)).map(l => l.id);
    onAssign({
      A: stack === "A" ? [...assignment.A, ...ids] : assignment.A,
      B: stack === "B" ? [...assignment.B, ...ids] : assignment.B,
    });
  };

  return (
    <div className="space-y-4">
      {/* ── Empty state: no contacts in the list yet ── */}
      {noLeads && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 py-14 flex flex-col items-center gap-3">
          <Users size={28} className="text-slate-700" />
          <p className="text-sm text-slate-400 font-semibold">No contacts in your list yet</p>
          <p className="text-xs text-slate-600 max-w-xs text-center">Add contacts to your Leads list first, then return here to assign them to each stack.</p>
          <a href="/leads" className="mt-1 px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-xs text-indigo-300 hover:bg-indigo-600/30 transition-all">Go to Leads →</a>
        </div>
      )}

      {/* Toolbar — only when contacts are available */}
      {hasLeads && <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>
        <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none">
          <option value="all">All industries</option>
          {industries.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none">
          <option value="all">All sources</option>
          {allSources.map(s => (
            <option key={s} value={s}>{SOURCE_LABELS[s] ?? s}</option>
          ))}
        </select>
        <button onClick={autoSplit} disabled={ALL_LEADS.every(l => assigned.has(l.id))}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs text-indigo-300 font-medium transition-all disabled:opacity-40">
          <Zap size={11} /> Auto-split {splitPct}/{100 - splitPct}
        </button>
        <button onClick={() => onAssign({ A: [], B: [] })} disabled={assigned.size === 0}
          className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all disabled:opacity-40">
          Clear all
        </button>
      </div>}

      {/* Progress bar */}
      {hasLeads && <div className="flex items-center gap-3 text-xs">
        <span className="text-slate-500">{ALL_LEADS.length - assigned.size} unassigned</span>
        <span className="text-indigo-400 font-medium">{assignment.A.length} → Stack A</span>
        <span className="text-emerald-400 font-medium">{assignment.B.length} → Stack B</span>
        {assigned.size > 0 && (
          <div className="flex h-1.5 bg-slate-800 rounded-full overflow-hidden flex-1 max-w-48">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(assignment.A.length / assigned.size) * 100}%` }} />
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(assignment.B.length / assigned.size) * 100}%` }} />
          </div>
        )}
      </div>}

      {/* Three-column kanban */}
      {hasLeads && <div className="grid grid-cols-3 gap-3">
        {/* Pool */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden flex flex-col">
          <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Unassigned pool</span>
            <span className="text-[10px] text-slate-600 font-mono">{pool.length}</span>
          </div>
          <div className="p-2.5 space-y-1.5 overflow-y-auto max-h-80 flex-1">
            {pool.length === 0
              ? <p className="text-[11px] text-slate-600 text-center py-10">{assigned.size === ALL_LEADS.length ? "All leads assigned" : "No matches"}</p>
              : pool.map(l => <LeadMiniCard key={l.id} lead={l} inStack="pool" onMoveA={() => move(l.id, "A")} onMoveB={() => move(l.id, "B")} />)
            }
          </div>
        </div>

        {/* Stack A */}
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 overflow-hidden flex flex-col">
          <div className="px-3 py-2.5 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-indigo-500 flex items-center justify-center text-[9px] font-bold text-white">A</span>
              <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider truncate">{stackAName}</span>
            </div>
            <span className="text-[10px] text-indigo-400/60 font-mono">{stackALeads.length}</span>
          </div>
          <div className="p-2.5 space-y-1.5 overflow-y-auto max-h-80 flex-1">
            {stackALeads.length === 0
              ? <p className="text-[11px] text-slate-600 text-center py-10">No leads assigned</p>
              : stackALeads.map(l => <LeadMiniCard key={l.id} lead={l} inStack="A" onRemove={() => unassign(l.id)} />)
            }
          </div>
        </div>

        {/* Stack B */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 overflow-hidden flex flex-col">
          <div className="px-3 py-2.5 border-b border-emerald-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-[9px] font-bold text-white">B</span>
              <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider truncate">{stackBName}</span>
            </div>
            <span className="text-[10px] text-emerald-400/60 font-mono">{stackBLeads.length}</span>
          </div>
          <div className="p-2.5 space-y-1.5 overflow-y-auto max-h-80 flex-1">
            {stackBLeads.length === 0
              ? <p className="text-[11px] text-slate-600 text-center py-10">No leads assigned</p>
              : stackBLeads.map(l => <LeadMiniCard key={l.id} lead={l} inStack="B" onRemove={() => unassign(l.id)} />)
            }
          </div>
        </div>
      </div>}

      {/* Bulk assign by segment */}
      {hasLeads &&
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Bulk assign by segment</div>

        {/* By industry */}
        <div>
          <div className="text-[10px] text-slate-500 mb-2">By industry</div>
          <div className="flex flex-wrap gap-2">
            {industries.map(ind => {
              const cnt = ALL_LEADS.filter(l => l.industry === ind && !assigned.has(l.id)).length;
              if (cnt === 0) return null;
              return (
                <div key={ind} className="flex items-center gap-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${INDUSTRY_COLORS[ind] ?? ""}`}>{ind} ({cnt})</span>
                  <button onClick={() => bulkAssign("industry", ind, "A")} className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all font-semibold">→A</button>
                  <button onClick={() => bulkAssign("industry", ind, "B")} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all font-semibold">→B</button>
                </div>
              );
            })}
            {industries.every(i => ALL_LEADS.filter(l => l.industry === i && !assigned.has(l.id)).length === 0) && (
              <p className="text-[11px] text-slate-600">All leads have been assigned.</p>
            )}
          </div>
        </div>

        {/* By source tool */}
        <div>
          <div className="text-[10px] text-slate-500 mb-2">By source tool</div>
          <div className="flex flex-wrap gap-2">
            {allSources.map(src => {
              const cnt = ALL_LEADS.filter(l => l.source === src && !assigned.has(l.id)).length;
              if (cnt === 0) return null;
              return (
                <div key={src} className="flex items-center gap-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${SOURCE_COLORS[src] ?? "text-slate-400 bg-slate-800 border-slate-700"}`}>{SOURCE_LABELS[src] ?? src} ({cnt})</span>
                  <button onClick={() => bulkAssign("source", src, "A")} className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all font-semibold">→A</button>
                  <button onClick={() => bulkAssign("source", src, "B")} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all font-semibold">→B</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>}
    </div>
  );
}

// ─── Experiment Detail View ────────────────────────────────────────────────

// ── Canvas image generator ──────────────────────────────────────────────────

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function buildResultsImage(exp: Experiment, mW: ExperimentMetrics, mL: ExperimentMetrics, winnerName: string, loserName: string): Promise<Blob> {
  return new Promise(resolve => {
    const W = 1200, H = 630;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d")!;
    const DIM = "#0f172a", CARD = "#1e293b", BORDER = "#334155";
    const INDIGO = "#6366f1", EMERALD = "#10b981", AMBER = "#f59e0b";
    const WHITE = "#f8fafc", MUTED = "#94a3b8", DIM2 = "#475569";

    // Background
    ctx.fillStyle = DIM; ctx.fillRect(0, 0, W, H);

    // Subtle top glow
    const g = ctx.createRadialGradient(600, 0, 0, 600, 200, 600);
    g.addColorStop(0, "rgba(99,102,241,0.18)"); g.addColorStop(1, "rgba(99,102,241,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Header bar
    ctx.fillStyle = CARD; ctx.fillRect(0, 0, W, 68);
    ctx.fillStyle = BORDER; ctx.fillRect(0, 68, W, 1);

    // Brand
    ctx.fillStyle = WHITE; ctx.font = "bold 22px system-ui,sans-serif"; ctx.fillText("iqpipe", 48, 38);
    ctx.fillStyle = INDIGO; ctx.font = "11px system-ui,sans-serif"; ctx.fillText("GTM INTELLIGENCE", 48, 56);

    // "A/B Test Results" badge
    ctx.fillStyle = "rgba(99,102,241,0.15)";
    rr(ctx, W - 240, 18, 196, 32, 16); ctx.fill();
    ctx.strokeStyle = "rgba(99,102,241,0.4)"; ctx.lineWidth = 1;
    rr(ctx, W - 240, 18, 196, 32, 16); ctx.stroke();
    ctx.fillStyle = "#a5b4fc"; ctx.font = "bold 12px system-ui,sans-serif";
    ctx.textAlign = "center"; ctx.fillText("A/B TEST RESULTS", W - 142, 38); ctx.textAlign = "left";

    // Experiment name
    ctx.fillStyle = WHITE; ctx.font = "bold 28px system-ui,sans-serif";
    const expLabel = exp.name.length > 58 ? exp.name.slice(0, 55) + "…" : exp.name;
    ctx.fillText(expLabel, 48, 116);

    // Meta line
    ctx.fillStyle = MUTED; ctx.font = "14px system-ui,sans-serif";
    ctx.fillText(`${exp.audienceSize} leads  ·  ${exp.splitPct}/${100-exp.splitPct} split  ·  ${exp.startDate}${exp.endDate ? " → " + exp.endDate : ""}`, 48, 142);

    // ── Winner badge ──────────────────────────────────────
    ctx.fillStyle = "rgba(245,158,11,0.12)";
    rr(ctx, 48, 160, 340, 38, 10); ctx.fill();
    ctx.strokeStyle = "rgba(245,158,11,0.35)"; ctx.lineWidth = 1;
    rr(ctx, 48, 160, 340, 38, 10); ctx.stroke();
    ctx.fillStyle = AMBER; ctx.font = "bold 14px system-ui,sans-serif";
    ctx.fillText("WINNER  " + winnerName, 70, 184);

    // ── Two metric columns ────────────────────────────────
    const METRICS = [
      { label: "Reply Rate",    a: mW.replyRate,    b: mL.replyRate,    fmt: (v: number) => `${v}%` },
      { label: "Meeting Rate",  a: mW.meetingRate,  b: mL.meetingRate,  fmt: (v: number) => `${v}%` },
      { label: "Revenue",       a: mW.revenue,      b: mL.revenue,      fmt: (v: number) => v > 0 ? `$${v.toLocaleString()}` : "—" },
      { label: "Cost/Lead",     a: mW.costPerLead,  b: mL.costPerLead,  fmt: (v: number) => `$${v}`, lowerBetter: true },
      { label: "Eff. Score",    a: mW.efficiencyScore, b: mL.efficiencyScore, fmt: (v: number) => `${v}/100` },
    ];

    // Column cards
    const cardY = 214, cardH = 290, cardW = 500;
    const colA = 48, colB = 620;

    // Stack A card (winner)
    ctx.fillStyle = "rgba(99,102,241,0.08)";
    rr(ctx, colA, cardY, cardW, cardH, 16); ctx.fill();
    ctx.strokeStyle = "rgba(99,102,241,0.4)"; ctx.lineWidth = 1.5;
    rr(ctx, colA, cardY, cardW, cardH, 16); ctx.stroke();

    // Stack B card
    ctx.fillStyle = CARD;
    rr(ctx, colB, cardY, cardW, cardH, 16); ctx.fill();
    ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
    rr(ctx, colB, cardY, cardW, cardH, 16); ctx.stroke();

    // Column headers
    ctx.fillStyle = INDIGO; ctx.font = "bold 12px system-ui,sans-serif";
    ctx.fillText("STACK A  —  " + winnerName.toUpperCase(), colA + 20, cardY + 28);
    ctx.fillStyle = DIM2; ctx.font = "bold 12px system-ui,sans-serif";
    ctx.fillText("STACK B  —  " + loserName.toUpperCase(), colB + 20, cardY + 28);

    // Separator
    ctx.strokeStyle = "rgba(99,102,241,0.2)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(colA + 20, cardY + 42); ctx.lineTo(colA + cardW - 20, cardY + 42); ctx.stroke();
    ctx.strokeStyle = BORDER;
    ctx.beginPath(); ctx.moveTo(colB + 20, cardY + 42); ctx.lineTo(colB + cardW - 20, cardY + 42); ctx.stroke();

    // Metrics
    METRICS.forEach((m, i) => {
      const rowY = cardY + 68 + i * 44;
      const aWins = m.lowerBetter ? m.a < m.b : m.a > m.b;

      // Stack A row
      ctx.fillStyle = MUTED; ctx.font = "13px system-ui,sans-serif";
      ctx.fillText(m.label, colA + 20, rowY);
      ctx.fillStyle = aWins ? EMERALD : WHITE;
      ctx.font = "bold 16px system-ui,sans-serif"; ctx.textAlign = "right";
      ctx.fillText(m.fmt(m.a), colA + cardW - 20, rowY); ctx.textAlign = "left";

      // Bar A
      const barW = cardW - 40, barH = 5, barY = rowY + 5;
      ctx.fillStyle = "rgba(255,255,255,0.05)"; rr(ctx, colA + 20, barY, barW, barH, 3); ctx.fill();
      const maxVal = Math.max(m.a, m.b) || 1;
      const fillA = (m.a / maxVal) * barW;
      ctx.fillStyle = aWins ? EMERALD : INDIGO;
      rr(ctx, colA + 20, barY, fillA, barH, 3); ctx.fill();

      // Stack B row
      ctx.fillStyle = MUTED; ctx.font = "13px system-ui,sans-serif";
      ctx.fillText(m.label, colB + 20, rowY);
      ctx.fillStyle = !aWins ? EMERALD : DIM2;
      ctx.font = "bold 16px system-ui,sans-serif"; ctx.textAlign = "right";
      ctx.fillText(m.fmt(m.b), colB + cardW - 20, rowY); ctx.textAlign = "left";

      ctx.fillStyle = "rgba(255,255,255,0.05)"; rr(ctx, colB + 20, barY, barW, barH, 3); ctx.fill();
      const fillB = (m.b / maxVal) * barW;
      ctx.fillStyle = !aWins ? EMERALD : BORDER;
      rr(ctx, colB + 20, barY, fillB, barH, 3); ctx.fill();
    });

    // ── Footer ────────────────────────────────────────────
    ctx.fillStyle = CARD; ctx.fillRect(0, H - 52, W, 52);
    ctx.fillStyle = BORDER; ctx.fillRect(0, H - 52, W, 1);
    ctx.fillStyle = MUTED; ctx.font = "13px system-ui,sans-serif";
    ctx.fillText("Tracked automatically with iqpipe  ·  iqpipe.io", 48, H - 20);
    ctx.fillStyle = DIM2; ctx.textAlign = "right";
    ctx.fillText("#GTM  #ABTesting  #RevenueOps  #SalesOps", W - 48, H - 20);
    ctx.textAlign = "left";

    c.toBlob(b => resolve(b!), "image/png");
  });
}

// ── ExperimentDetail ────────────────────────────────────────────────────────

function ExperimentDetail({ exp, onClose, onUpdate, leads, workspaceId }: {
  exp: Experiment;
  onClose: () => void;
  onUpdate?: (patch: Partial<Experiment>) => void;
  leads: Lead[];
  workspaceId?: string | null;
}) {
  const [view, setView] = useState<"comparison" | "funnels" | "sequences" | "audience">("comparison");
  const [assignment, setAssignment] = useState<{ A: string[]; B: string[] }>(
    exp.leadAssignment ?? { A: [], B: [] }
  );
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<{ pushed: number; total: number; errors: number } | null>(null);

  const handleAssign = (a: { A: string[]; B: string[] }) => {
    setAssignment(a);
    onUpdate?.({ leadAssignment: a });
  };

  const handleLaunch = async () => {
    if (!workspaceId) return;
    const total = assignment.A.length + assignment.B.length;
    if (total === 0) return;
    setLaunching(true);
    setLaunchResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/experiments/${exp.id}/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      setLaunchResult({ pushed: data.pushed ?? 0, total: data.total ?? total, errors: (data.results ?? []).filter((r: any) => !r.success).length });
    } catch { setLaunchResult({ pushed: 0, total, errors: total }); }
    finally { setLaunching(false); }
  };
  const [shareState, setShareState] = useState<"idle" | "generating" | "done">("idle");
  const [lastShared, setLastShared] = useState<"email" | "linkedin" | null>(null);
  const [linkedinReady, setLinkedinReady] = useState(false);
  const mA = exp.metricsA;
  const mB = exp.metricsB;

  const winnerStack   = exp.winner === "A" ? exp.stackA  : exp.winner === "B" ? exp.stackB  : null;
  const loserStack    = exp.winner === "A" ? exp.stackB  : exp.winner === "B" ? exp.stackA  : null;
  const winnerMetrics = exp.winner === "A" ? mA : exp.winner === "B" ? mB : null;
  const loserMetrics  = exp.winner === "A" ? mB : exp.winner === "B" ? mA : null;

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleEmailShare = async () => {
    if (!exp.winner || !winnerStack || !winnerMetrics || !loserMetrics) return;
    setShareState("generating");
    try {
      const blob = await buildResultsImage(exp, winnerMetrics, loserMetrics, winnerStack.name, loserStack!.name);
      const filename = `iqpipe-ab-results-${exp.id}.png`;
      downloadBlob(blob, filename);
      const effDiff = exp.winner === "A"
        ? Math.round((mA.efficiencyScore - mB.efficiencyScore) / mB.efficiencyScore * 100)
        : Math.round((mB.efficiencyScore - mA.efficiencyScore) / mA.efficiencyScore * 100);
      const subject = encodeURIComponent(`A/B Test Results: ${exp.name}`);
      const body = encodeURIComponent([
        `Hi,`,
        ``,
        `I'm sharing the results of our GTM stack A/B test.`,
        ``,
        `Experiment: ${exp.name}`,
        `Audience: ${exp.audienceSize} leads (${exp.splitPct}/${100-exp.splitPct} split)`,
        `Winner: Stack ${exp.winner} — ${winnerStack.name}`,
        ``,
        `Key results:`,
        `  Reply Rate:   ${winnerMetrics.replyRate}% vs ${loserMetrics.replyRate}%`,
        `  Meeting Rate: ${winnerMetrics.meetingRate}% vs ${loserMetrics.meetingRate}%`,
        winnerMetrics.revenue > 0 ? `  Revenue:      $${winnerMetrics.revenue.toLocaleString()} vs $${loserMetrics.revenue.toLocaleString()}` : null,
        `  Efficiency:   ${winnerMetrics.efficiencyScore}/100 vs ${loserMetrics.efficiencyScore}/100 (+${effDiff}%)`,
        ``,
        `The results image has been downloaded as "${filename}". Please attach it to this email.`,
        ``,
        `Tracked with iqpipe — iqpipe.io`,
      ].filter(Boolean).join("\n"));
      window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
      setLastShared("email");
      setShareState("done");
      setTimeout(() => setShareState("idle"), 4000);
    } catch {
      setShareState("idle");
    }
  };

  // Step 1: generate image + load clipboard (no window.open — async work happens here)
  const handleLinkedInPrepare = async () => {
    if (!exp.winner || !winnerStack || !winnerMetrics || !loserMetrics) return;
    setShareState("generating");
    try {
      const blob = await buildResultsImage(exp, winnerMetrics, loserMetrics, winnerStack.name, loserStack!.name);
      const effDiff = exp.winner === "A"
        ? Math.round((mA.efficiencyScore - mB.efficiencyScore) / mB.efficiencyScore * 100)
        : Math.round((mB.efficiencyScore - mA.efficiencyScore) / mA.efficiencyScore * 100);
      const postText = [
        `We ran a GTM stack A/B test across ${exp.audienceSize} leads — and the data is in.`,
        ``,
        `Experiment: ${exp.name}`,
        `Winner: Stack ${exp.winner} — ${winnerStack.name}`,
        ``,
        `Results:`,
        `Reply Rate: ${winnerMetrics.replyRate}% vs ${loserMetrics.replyRate}%`,
        `Meeting Rate: ${winnerMetrics.meetingRate}% vs ${loserMetrics.meetingRate}%`,
        winnerMetrics.revenue > 0 ? `Revenue: $${winnerMetrics.revenue.toLocaleString()} vs $${loserMetrics.revenue.toLocaleString()}` : null,
        `Efficiency Score: ${winnerMetrics.efficiencyScore} vs ${loserMetrics.efficiencyScore} (+${effDiff}%)`,
        ``,
        `Tracked automatically with iqpipe — no manual logging, just one pipe for your entire GTM stack.`,
        ``,
        `#GTM #ABTesting #SalesOps #OutboundSales #RevenueOps`,
      ].filter(Boolean).join("\n");

      // Embed image as base64 in the HTML clipboard payload
      const dataUrl = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      const htmlLines = postText.split("\n").map(l => l.trim() ? `<p>${l}</p>` : "<br>").join("");
      const htmlPayload = `${htmlLines}<br><img src="${dataUrl}" alt="A/B Test Results" style="max-width:100%;border-radius:8px">`;

      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html":  new Blob([htmlPayload], { type: "text/html" }),
            "text/plain": new Blob([postText],    { type: "text/plain" }),
          }),
        ]);
      } catch {
        await navigator.clipboard.writeText(postText);
      }

      // Also download the PNG so user can attach it manually if paste doesn't include image
      downloadBlob(blob, `iqpipe-ab-results-${exp.id}.png`);

      setLastShared("linkedin");
      setLinkedinReady(true);
      setShareState("done");
    } catch {
      setShareState("idle");
    }
  };

  // Step 2: called on a direct user click — opens LinkedIn (no async, no popup blocker)
  const handleLinkedInOpen = () => {
    const a = document.createElement("a");
    a.href = "https://www.linkedin.com/feed/?shareActive=true";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setLinkedinReady(false);
    setTimeout(() => setShareState("idle"), 200);
  };

  const funnelA = [
    { label: "Contacted", pct: Math.round(mA.contacted / mA.leadsCount * 100), count: mA.contacted },
    { label: "Opened",    pct: Math.round(mA.openRate),    count: Math.round(mA.contacted * mA.openRate / 100) },
    { label: "Replied",   pct: Math.round(mA.replyRate),   count: Math.round(mA.contacted * mA.replyRate / 100) },
    { label: "Meeting",   pct: Math.round(mA.meetingRate), count: Math.round(mA.contacted * mA.meetingRate / 100) },
    { label: "Won",       pct: Math.round(mA.winRate),     count: Math.round(mA.contacted * mA.meetingRate / 100 * mA.winRate / 100) },
  ];
  const funnelB = [
    { label: "Contacted", pct: Math.round(mB.contacted / mB.leadsCount * 100), count: mB.contacted },
    { label: "Opened",    pct: Math.round(mB.openRate),    count: Math.round(mB.contacted * mB.openRate / 100) },
    { label: "Replied",   pct: Math.round(mB.replyRate),   count: Math.round(mB.contacted * mB.replyRate / 100) },
    { label: "Meeting",   pct: Math.round(mB.meetingRate), count: Math.round(mB.contacted * mB.meetingRate / 100) },
    { label: "Won",       pct: Math.round(mB.winRate),     count: Math.round(mB.contacted * mB.meetingRate / 100 * mB.winRate / 100) },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <FlaskConical size={18} className="text-indigo-400" />
              <h2 className="text-lg font-bold text-white">{exp.name}</h2>
              <StatusBadge status={exp.status} />
            </div>
            <p className="text-xs text-slate-400">
              {exp.audienceSize} leads · {exp.splitPct}% / {100 - exp.splitPct}% split · {exp.startDate}{exp.endDate ? ` → ${exp.endDate}` : " (ongoing)"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300">
            <X size={16} />
          </button>
        </div>

        {/* Winner banner */}
        {exp.winner && (
          <div className={`mb-6 p-4 rounded-2xl border ${
            exp.winner === "A" ? "border-indigo-500/40 bg-indigo-500/10" : "border-emerald-500/40 bg-emerald-500/10"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Trophy size={20} className={exp.winner === "A" ? "text-indigo-400" : "text-emerald-400"} />
                <div>
                  <div className="text-sm font-bold text-white">
                    Winner: Stack {exp.winner} — {exp.winner === "A" ? exp.stackA.name : exp.stackB.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {exp.winner === "A"
                      ? `+${Math.round((mA.efficiencyScore - mB.efficiencyScore) / mB.efficiencyScore * 100)}% higher efficiency · ${(mA.replyRate - mB.replyRate).toFixed(1)}pp more replies · $${(mA.revenue - mB.revenue).toLocaleString()} more revenue`
                      : `+${Math.round((mB.efficiencyScore - mA.efficiencyScore) / mA.efficiencyScore * 100)}% higher efficiency`
                    }
                  </div>
                </div>
              </div>

              {/* Share buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <Share2 size={11} /> Share results
                </span>
                <button
                  onClick={handleEmailShare}
                  disabled={shareState === "generating"}
                  title="Downloads a PNG image + opens email draft"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white transition-all disabled:opacity-50"
                >
                  <Mail size={12} />
                  {shareState === "generating" ? "Generating…" : "Email"}
                </button>
                {!linkedinReady ? (
                  <button
                    onClick={handleLinkedInPrepare}
                    disabled={shareState === "generating"}
                    title="Generates image, copies post + image to clipboard, then shows Open LinkedIn button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-xs text-blue-300 hover:text-blue-200 transition-all disabled:opacity-50"
                  >
                    <Linkedin size={12} />
                    {shareState === "generating" ? "Preparing…" : "LinkedIn"}
                  </button>
                ) : (
                  <button
                    onClick={handleLinkedInOpen}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 border border-blue-400/50 text-xs text-blue-200 font-semibold transition-all animate-pulse"
                  >
                    <Linkedin size={12} /> Open LinkedIn →
                  </button>
                )}
              </div>
            </div>

            {/* Share instruction toast */}
            {shareState === "done" && (
              <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Check size={12} className="text-emerald-400 shrink-0" />
                <p className="text-[11px] text-emerald-300">
                  {lastShared === "email" && "Image downloaded — attach the PNG file to your email draft."}
                  {lastShared === "linkedin" && linkedinReady && "Post text + image copied & PNG downloaded. Click \"Open LinkedIn →\", then press Ctrl+V (⌘V) inside the compose box. If the image didn't paste, attach the downloaded PNG."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 mb-6 w-fit">
          {(["comparison", "funnels", "sequences", "audience"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize flex items-center gap-1.5 ${
                view === v ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-300"
              }`}
            >
              {v === "audience" && <Users size={11} />}
              {v}
              {v === "audience" && (assignment.A.length + assignment.B.length) > 0 && (
                <span className="px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold">
                  {assignment.A.length + assignment.B.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Comparison View ── */}
        {view === "comparison" && (
          <div className="space-y-4">
            {/* Efficiency Scores */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { side: "A" as const, stack: exp.stackA, m: mA },
                { side: "B" as const, stack: exp.stackB, m: mB },
              ].map(({ side, stack, m }) => {
                const isWinner = exp.winner === side;
                return (
                  <div key={side} className={`rounded-2xl border p-5 ${isWinner ? (side === "A" ? "border-indigo-500/50 bg-indigo-500/5" : "border-emerald-500/50 bg-emerald-500/5") : "border-slate-800 bg-slate-900/60"}`}>
                    <div className="flex items-start justify-between mb-4">
                      <StackBadge stack={stack} side={side} />
                      {isWinner && <Trophy size={14} className={side === "A" ? "text-indigo-400" : "text-emerald-400"} />}
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{m.efficiencyScore}<span className="text-lg text-slate-500">/100</span></div>
                    <div className="text-xs text-slate-400 mb-3">Efficiency Score</div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                      <div className={`h-full rounded-full ${side === "A" ? "bg-indigo-500" : "bg-emerald-500"}`} style={{ width: `${m.efficiencyScore}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { label: "Reply Rate",   value: `${m.replyRate}%` },
                        { label: "Meetings",     value: `${m.meetingRate}%` },
                        { label: "Revenue",      value: m.revenue > 0 ? `$${m.revenue.toLocaleString()}` : "—" },
                        { label: "Cost/Lead",    value: `$${m.costPerLead}` },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-950 rounded-lg p-2 border border-slate-800">
                          <div className="text-slate-500 text-[10px] mb-0.5">{label}</div>
                          <div className="text-slate-100 font-semibold">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Head-to-head metrics */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] gap-2 mb-3 text-[10px] font-semibold uppercase tracking-wider">
                <div className="text-indigo-400 text-right">Stack A</div>
                <div />
                <div className="text-center text-slate-500 px-3">Metric</div>
                <div />
                <div className="text-emerald-400">Stack B</div>
              </div>
              <MetricRow label="Open Rate"          a={mA.openRate}       b={mB.openRate}       format="pct" />
              <MetricRow label="Reply Rate"         a={mA.replyRate}      b={mB.replyRate}       format="pct" />
              <MetricRow label="Meeting Rate"       a={mA.meetingRate}    b={mB.meetingRate}     format="pct" />
              <MetricRow label="Deal Win Rate"      a={mA.winRate}        b={mB.winRate}         format="pct" />
              <MetricRow label="Revenue"            a={mA.revenue}        b={mB.revenue}         format="currency" />
              <MetricRow label="Cost per Lead"      a={mA.costPerLead}    b={mB.costPerLead}     format="currency" higherIsBetter={false} />
              <MetricRow label="Avg Days to Reply"  a={mA.avgDaysToReply} b={mB.avgDaysToReply}  format="days" higherIsBetter={false} />
              <MetricRow label="Efficiency Score"   a={mA.efficiencyScore}b={mB.efficiencyScore} format="number" />
            </div>
          </div>
        )}

        {/* ── Funnel View ── */}
        {view === "funnels" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { side: "A" as const, stack: exp.stackA, funnel: funnelA, color: "bg-indigo-500" },
              { side: "B" as const, stack: exp.stackB, funnel: funnelB, color: "bg-emerald-500" },
            ].map(({ side, stack, funnel, color }) => (
              <div key={side} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="mb-4"><StackBadge stack={stack} side={side} /></div>
                <div className="space-y-3">
                  {funnel.map(f => (
                    <FunnelBar key={f.label} label={f.label} pct={f.pct} count={f.count} color={color} />
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
                  {exp.metricsA.leadsCount} leads entering funnel
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Sequences View ── */}
        {view === "sequences" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { side: "A" as const, stack: exp.stackA },
              { side: "B" as const, stack: exp.stackB },
            ].map(({ side, stack }) => (
              <div key={side} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="mb-4"><StackBadge stack={stack} side={side} /></div>

                {/* Tools used */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(Object.entries(stack.tools) as [ToolCategory, string][]).map(([cat, tid]) => {
                    const tool = TOOL_OPTIONS[cat].find(t => t.id === tid);
                    if (!tool) return null;
                    const cfg = CAT_CFG[cat];
                    const Icon = cfg.icon;
                    return (
                      <span key={cat} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] border ${cfg.border} ${cfg.bg} ${cfg.color}`}>
                        <Icon size={9} />{tool.name}
                      </span>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  {stack.sequence.map((step, i) => {
                    const chCfg = CHANNEL_CFG[step.channel];
                    const ChIcon = chCfg.icon;
                    return (
                      <div key={step.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full ${chCfg.bg} flex items-center justify-center shrink-0`}>
                            <ChIcon size={11} className={chCfg.color} />
                          </div>
                          {i < stack.sequence.length - 1 && <div className="w-px flex-1 bg-slate-800 mt-1 mb-1" />}
                        </div>
                        <div className="pb-3 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-slate-200">{step.action}</span>
                            <span className="text-[10px] text-slate-600">Day {step.day}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{step.template.slice(0, 80)}{step.template.length > 80 ? "…" : ""}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Audience View ── */}
        {view === "audience" && (
          <div className="space-y-4">
            <AudienceManager
              splitPct={exp.splitPct}
              stackAName={exp.stackA.name}
              stackBName={exp.stackB.name}
              assignment={assignment}
              onAssign={handleAssign}
              leads={leads}
            />

            {/* Launch bar */}
            {(assignment.A.length + assignment.B.length) > 0 && (
              <div className="flex items-center justify-between p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Push contacts to outreach tools</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {assignment.A.length} → {exp.stackA.name} · {assignment.B.length} → {exp.stackB.name}
                    {(exp.stackA.tools.outreach === "heyreach" || exp.stackB.tools.outreach === "heyreach") && (
                      <span className="ml-2 text-indigo-400">· HeyReach campaigns will receive these contacts</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {launchResult && (
                    <span className={`text-xs font-medium ${launchResult.errors === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                      {launchResult.pushed}/{launchResult.total} pushed{launchResult.errors > 0 ? ` · ${launchResult.errors} failed` : " ✓"}
                    </span>
                  )}
                  <button
                    onClick={handleLaunch}
                    disabled={launching}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    {launching
                      ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Pushing…</>
                      : <><Zap size={12} /> Launch to tools</>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Wizard ─────────────────────────────────────────────────────────

const DEFAULT_STACK = (name: string): StackConfig => ({
  id: uid(), name, tools: {}, sequence: [
    { id: uid(), day: 1, channel: "email", action: "Initial outreach", template: "" },
    { id: uid(), day: 5, channel: "email", action: "Follow-up",         template: "" },
  ],
});

// ─── Pre-built stack templates ─────────────────────────────────────────────

type StackTemplate = {
  id: string;
  name: string;
  description: string;
  tagline: string;
  stackA: Omit<StackConfig, "id">;
  stackB: Omit<StackConfig, "id">;
};

const STACK_TEMPLATES: StackTemplate[] = [
  {
    id: "waterfall",
    name: "The Waterfall",
    description: "High-quality enrichment vs. volume-first approach.",
    tagline: "Clay waterfall vs. Apollo blitz — which quality wins more?",
    stackA: {
      name: "Clay Waterfall",
      tools: { prospecting: "clay", enrichment: "clearbit", outreach: "lemlist" },
      sequence: [
        { id: uid(), day: 1, channel: "email", action: "Personalised intro", template: "Hi {{first_name}}, noticed {{company}} is scaling its {{dept}} team…" },
        { id: uid(), day: 4, channel: "linkedin", action: "LinkedIn connect", template: "Hi {{first_name}} — sent you an email earlier, happy to connect here too." },
        { id: uid(), day: 8, channel: "email", action: "Value add follow-up", template: "Wanted to share a quick resource on {{pain_point}}…" },
        { id: uid(), day: 14, channel: "email", action: "Break-up email", template: "Last note — worth a 15-min chat?" },
      ],
    },
    stackB: {
      name: "Apollo Volume",
      tools: { prospecting: "apollo", enrichment: "hunter", outreach: "smartlead" },
      sequence: [
        { id: uid(), day: 1, channel: "email", action: "High-volume intro", template: "Hi {{first_name}}, quick one — we help {{industry}} teams {{benefit}}." },
        { id: uid(), day: 3, channel: "email", action: "Follow-up 1", template: "Did you see my earlier note? Happy to show a quick demo." },
        { id: uid(), day: 6, channel: "email", action: "Social proof", template: "Companies like {{similar_co}} use us to {{outcome}}." },
        { id: uid(), day: 10, channel: "email", action: "Break-up", template: "Not the right time? Let me know when to follow up." },
      ],
    },
  },
  {
    id: "multitouch",
    name: "The Multitouch",
    description: "Email-only versus omnichannel (email + LinkedIn + call).",
    tagline: "Does adding LinkedIn & calls meaningfully move the needle?",
    stackA: {
      name: "Email Only",
      tools: { prospecting: "apollo", outreach: "instantly" },
      sequence: [
        { id: uid(), day: 1, channel: "email", action: "Cold intro", template: "Hi {{first_name}}, {{personalised_opener}}…" },
        { id: uid(), day: 4, channel: "email", action: "Follow-up", template: "Bumping this up — any interest in a quick call?" },
        { id: uid(), day: 9, channel: "email", action: "Case study", template: "{{similar_company}} cut {{metric}} by {{pct}}% using our approach." },
        { id: uid(), day: 16, channel: "email", action: "Break-up", template: "Closing the loop — last email from me for now." },
      ],
    },
    stackB: {
      name: "Omnichannel",
      tools: { prospecting: "clay", outreach: "lemlist" },
      sequence: [
        { id: uid(), day: 1, channel: "email", action: "Cold intro", template: "Hi {{first_name}}, {{personalised_opener}}…" },
        { id: uid(), day: 2, channel: "linkedin", action: "LinkedIn view + connect", template: "Connected on LinkedIn — saw your post on {{topic}}." },
        { id: uid(), day: 5, channel: "email", action: "Follow-up", template: "Sent you a LinkedIn request too — wanted to share {{value}}." },
        { id: uid(), day: 8, channel: "call", action: "Discovery call attempt", template: "Calling to follow up on my emails about {{topic}}." },
        { id: uid(), day: 14, channel: "email", action: "Break-up", template: "Last note — worth a 15-min call?" },
      ],
    },
  },
  {
    id: "linkedin_first",
    name: "The LinkedIn Lead",
    description: "Traditional email-led vs. LinkedIn-first prospecting.",
    tagline: "Test whether LinkedIn warm-up improves email open rates.",
    stackA: {
      name: "Email First",
      tools: { prospecting: "apollo", outreach: "instantly" },
      sequence: [
        { id: uid(), day: 1, channel: "email", action: "Cold email", template: "Hi {{first_name}}, I wanted to reach out about {{topic}}." },
        { id: uid(), day: 5, channel: "linkedin", action: "LinkedIn follow-up", template: "Sent an email — happy to connect here too." },
        { id: uid(), day: 10, channel: "email", action: "Second email", template: "Circling back — did you have a chance to review?" },
      ],
    },
    stackB: {
      name: "LinkedIn First",
      tools: { prospecting: "phantombuster", outreach: "heyreach" },
      sequence: [
        { id: uid(), day: 1, channel: "linkedin", action: "LinkedIn connect", template: "Hi {{first_name}} — I work with companies like {{company}} on {{topic}}." },
        { id: uid(), day: 3, channel: "linkedin", action: "LinkedIn message", template: "Thanks for connecting! Quick question — are you currently using {{tool}}?" },
        { id: uid(), day: 7, channel: "email", action: "Email follow-up", template: "Following up on my LinkedIn message with a bit more detail…" },
      ],
    },
  },
  {
    id: "crm_speed",
    name: "The Speed Trial",
    description: "Fast follow-up sequence vs. thoughtful slow-burn nurture.",
    tagline: "Does responding faster or building relationship first win?",
    stackA: {
      name: "Fast Strike (7-day)",
      tools: { prospecting: "lusha", outreach: "smartlead", crm: "hubspot" },
      sequence: [
        { id: uid(), day: 1, channel: "email", action: "Same-day outreach", template: "Hi {{first_name}}, {{personalised_line}}. Can we chat this week?" },
        { id: uid(), day: 2, channel: "linkedin", action: "LinkedIn", template: "Connecting here as well — sent you an email." },
        { id: uid(), day: 4, channel: "email", action: "Quick follow-up", template: "Any interest? I can do 15 min at your convenience." },
        { id: uid(), day: 7, channel: "call", action: "Call attempt", template: "Following up on my emails." },
      ],
    },
    stackB: {
      name: "Slow Burn (28-day)",
      tools: { prospecting: "clay", enrichment: "clearbit", outreach: "lemlist", crm: "salesforce" },
      sequence: [
        { id: uid(), day: 1, channel: "email", action: "Intro + resource", template: "Hi {{first_name}}, thought you'd find this useful: {{resource}}." },
        { id: uid(), day: 7, channel: "linkedin", action: "LinkedIn engage", template: "Loved your post on {{topic}} — my thoughts below." },
        { id: uid(), day: 14, channel: "email", action: "Case study", template: "Here's how {{similar_company}} achieved {{outcome}} using our approach." },
        { id: uid(), day: 21, channel: "email", action: "Soft ask", template: "Would it make sense to have a quick call?" },
        { id: uid(), day: 28, channel: "email", action: "Break-up", template: "Closing the loop — let me know if the timing is ever right." },
      ],
    },
  },
];

type WizardState = {
  name: string;
  audienceSize: number;
  splitPct: number;
  kpis: string[];
  stackA: StackConfig;
  stackB: StackConfig;
  leadAssignment: { A: string[]; B: string[] };
};

function CreateWizard({ onSave, onCancel, leads, workspaceId }: { onSave: (e: Experiment) => void | Promise<void>; onCancel: () => void; leads: Lead[]; workspaceId?: string | null }) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>({
    name: "",
    audienceSize: 200,
    splitPct: 50,
    kpis: ["Reply Rate", "Meeting Booking Rate"],
    stackA: DEFAULT_STACK("Stack A"),
    stackB: DEFAULT_STACK("Stack B"),
    leadAssignment: { A: [], B: [] },
  });

  const toggleKpi = (kpi: string) =>
    setState(s => ({
      ...s,
      kpis: s.kpis.includes(kpi) ? s.kpis.filter(k => k !== kpi) : [...s.kpis, kpi],
    }));

  const handleLaunch = () => {
    const totalAssigned = state.leadAssignment.A.length + state.leadAssignment.B.length;
    const exp: Experiment = {
      id: "exp-" + uid(),
      name: state.name || "Untitled Experiment",
      status: "active",
      startDate: new Date().toISOString().slice(0, 10),
      audienceSize: totalAssigned > 0 ? totalAssigned : state.audienceSize,
      splitPct: state.splitPct,
      kpis: state.kpis,
      stackA: state.stackA,
      stackB: state.stackB,
      leadAssignment: state.leadAssignment,
      metricsA: { leadsCount: totalAssigned > 0 ? state.leadAssignment.A.length : Math.round(state.audienceSize * state.splitPct / 100), contacted: 0, openRate: 0, replyRate: 0, meetingRate: 0, dealRate: 0, winRate: 0, revenue: 0, costPerLead: 0, avgDaysToReply: 0, efficiencyScore: 0 },
      metricsB: { leadsCount: totalAssigned > 0 ? state.leadAssignment.B.length : Math.round(state.audienceSize * (100 - state.splitPct) / 100), contacted: 0, openRate: 0, replyRate: 0, meetingRate: 0, dealRate: 0, winRate: 0, revenue: 0, costPerLead: 0, avgDaysToReply: 0, efficiencyScore: 0 },
    };
    onSave(exp);
  };

  const WIZARD_STEPS = ["Setup", "Stack A", "Stack B", "KPIs", "Audience", "Review"];
  const canNext = [
    state.name.length > 0,
    state.stackA.name.length > 0,
    state.stackB.name.length > 0,
    state.kpis.length > 0,
    true, // audience is optional — user can skip
    true,
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FlaskConical size={18} className="text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Create A/B Experiment</h2>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700">
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {WIZARD_STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                i < step ? "bg-indigo-500 text-white" : i === step ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50" : "bg-slate-800 text-slate-600"
              }`}>
                {i < step ? <CheckCircle2 size={12} /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? "text-slate-200 font-semibold" : i < step ? "text-indigo-400" : "text-slate-600"}`}>{s}</span>
              {i < WIZARD_STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? "bg-indigo-500/50" : "bg-slate-800"}`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {/* Step 0: Setup */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="max-w-lg space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Experiment name</label>
                  <input
                    type="text"
                    placeholder="e.g. Clay + Lemlist vs Apollo + Instantly"
                    value={state.name}
                    onChange={e => setState(s => ({ ...s, name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Total audience size</label>
                  <input
                    type="number"
                    min={10}
                    value={state.audienceSize}
                    onChange={e => setState(s => ({ ...s, audienceSize: +e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Split: A / B (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min={10} max={90} step={5}
                      value={state.splitPct}
                      onChange={e => setState(s => ({ ...s, splitPct: +e.target.value }))}
                      className="flex-1"
                    />
                    <span className="text-sm text-slate-200 font-mono w-20 text-right">
                      {state.splitPct}% / {100 - state.splitPct}%
                    </span>
                  </div>
                  <div className="flex gap-1 mt-2 h-2">
                    <div className="bg-indigo-500 rounded-l-full" style={{ width: `${state.splitPct}%` }} />
                    <div className="bg-emerald-500 rounded-r-full" style={{ width: `${100 - state.splitPct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>Stack A: {Math.round(state.audienceSize * state.splitPct / 100)} leads</span>
                    <span>Stack B: {Math.round(state.audienceSize * (100 - state.splitPct) / 100)} leads</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Stack A */}
          {step === 1 && (
            <StackBuilder
              value={state.stackA}
              onChange={stackA => setState(s => ({ ...s, stackA }))}
              label="Stack A"
              colorClass="border-indigo-500/30 bg-indigo-500/5"
              workspaceId={workspaceId}
            />
          )}

          {/* Step 2: Stack B */}
          {step === 2 && (
            <StackBuilder
              value={state.stackB}
              onChange={stackB => setState(s => ({ ...s, stackB }))}
              label="Stack B"
              colorClass="border-emerald-500/30 bg-emerald-500/5"
              workspaceId={workspaceId}
            />
          )}

          {/* Step 3: KPIs */}
          {step === 3 && (
            <div className="max-w-lg">
              <h3 className="text-sm font-semibold text-slate-100 mb-1">What will you measure?</h3>
              <p className="text-xs text-slate-400 mb-5">Select the KPIs that determine the winner of this experiment.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {KPI_OPTIONS.map(kpi => {
                  const selected = state.kpis.includes(kpi);
                  return (
                    <button
                      key={kpi}
                      onClick={() => toggleKpi(kpi)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        selected ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-200" : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <Target size={14} className={selected ? "text-indigo-400" : "text-slate-600"} />
                      <span className="text-xs font-medium">{kpi}</span>
                      {selected && <CheckCircle2 size={13} className="text-indigo-400 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Audience */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 mb-1">Assign leads to each stack</h3>
                  <p className="text-xs text-slate-400">Choose which contacts go into Stack A or Stack B. You can skip this step and assign leads later.</p>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] text-slate-400">
                  {state.leadAssignment.A.length + state.leadAssignment.B.length} / {leads.length} assigned
                </span>
              </div>
              <AudienceManager
                splitPct={state.splitPct}
                stackAName={state.stackA.name}
                stackBName={state.stackB.name}
                assignment={state.leadAssignment}
                onAssign={la => setState(s => ({ ...s, leadAssignment: la }))}
                leads={leads}
              />
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-100 mb-3">Review & Launch</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { side: "A" as const, stack: state.stackA, assignedCount: state.leadAssignment.A.length, fallback: Math.round(state.audienceSize * state.splitPct / 100) },
                  { side: "B" as const, stack: state.stackB, assignedCount: state.leadAssignment.B.length, fallback: Math.round(state.audienceSize * (100 - state.splitPct) / 100) },
                ].map(({ side, stack, assignedCount, fallback }) => {
                  const totalAssigned = state.leadAssignment.A.length + state.leadAssignment.B.length;
                  const leadCount = totalAssigned > 0 ? assignedCount : fallback;
                  const sampleLeads = leads.filter(l => (side === "A" ? state.leadAssignment.A : state.leadAssignment.B).includes(l.id)).slice(0, 3);
                  return (
                    <div key={side} className={`rounded-2xl border p-4 ${side === "A" ? "border-indigo-500/30 bg-indigo-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
                      <StackBadge stack={stack} side={side} />
                      <div className="mt-3 space-y-1.5">
                        <div className="text-xs text-slate-400">
                          <span className="text-slate-500">Leads:</span>{" "}
                          <span className="text-slate-200 font-medium">{leadCount}</span>
                          {totalAssigned > 0 && <span className="text-slate-600"> (manually assigned)</span>}
                        </div>
                        <div className="text-xs text-slate-400"><span className="text-slate-500">Tools:</span> {Object.values(stack.tools).length > 0 ? Object.entries(stack.tools).map(([cat, tid]) => TOOL_OPTIONS[cat as ToolCategory].find(t => t.id === tid)?.name).filter(Boolean).join(", ") : "—"}</div>
                        <div className="text-xs text-slate-400"><span className="text-slate-500">Steps:</span> {stack.sequence.length} sequence steps</div>
                        {sampleLeads.length > 0 && (
                          <div className="pt-1">
                            <div className="text-[10px] text-slate-500 mb-1.5">Sample contacts</div>
                            <div className="space-y-1">
                              {sampleLeads.map(l => (
                                <div key={l.id} className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400 shrink-0">
                                    {l.name.split(" ").map(w => w[0]).join("").slice(0,2)}
                                  </div>
                                  <span className="text-[10px] text-slate-400 truncate">{l.name} · {l.company}</span>
                                </div>
                              ))}
                              {assignedCount > 3 && (
                                <div className="text-[10px] text-slate-600">+{assignedCount - 3} more</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-xs text-slate-500 mb-2">KPIs being tracked</div>
                <div className="flex flex-wrap gap-2">
                  {state.kpis.map(kpi => (
                    <span key={kpi} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300">{kpi}</span>
                  ))}
                </div>
              </div>

              {state.leadAssignment.A.length + state.leadAssignment.B.length === 0 && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                  <Users size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400">No leads assigned yet. You can assign contacts from the <strong className="text-slate-300">Audience</strong> tab after launching.</p>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">Launching will create the experiment in <strong>active</strong> status. Results will populate as events are recorded from your connected tools.</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-4 border-t border-slate-800">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onCancel()}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:border-slate-600 transition-all"
          >
            {step === 0 ? "Cancel" : "← Back"}
          </button>
          {step < WIZARD_STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext[step]}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-sm text-white font-medium hover:bg-indigo-500 disabled:opacity-40 transition-all"
            >
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleLaunch}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-sm text-white font-medium hover:bg-emerald-500 transition-all"
            >
              <Zap size={15} /> Launch Experiment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function ABTestingPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [leads, setLeads]             = useState<Lead[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [creating, setCreating]       = useState(false);
  const [tab, setTab]                 = useState<"all" | "active" | "completed">("all");
  const [guideOpen, setGuideOpen]     = useState(false);


  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("iqpipe_token") ?? "";
        const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const wsRes = await fetch(`${API_BASE_URL}/api/workspaces/primary`, { headers: authHeader });
        if (!wsRes.ok) return;
        const { id: wsId } = await wsRes.json();
        setWorkspaceId(wsId);

        const [expRes, leadsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/experiments?workspaceId=${wsId}`, { headers: authHeader }),
          fetch(`${API_BASE_URL}/api/leads?workspaceId=${wsId}&limit=500`, { headers: authHeader }),
        ]);

        if (expRes.ok) {
          const exps = await expRes.json();
          setExperiments(exps);
        }

        if (leadsRes.ok) {
          const raw = await leadsRes.json();
          const mapped = (Array.isArray(raw) ? raw : raw.leads ?? [])
            .map(mapApiLead)
            .filter(Boolean) as Lead[];
          setLeads(mapped);
        }
      } catch (err) {
        console.error("ABTesting load error:", err);
      }
    }
    load();
  }, []);

  const selected = experiments.find(e => e.id === selectedId);

  const handleUpdateExp = useCallback(async (id: string, patch: Partial<Experiment>) => {
    setExperiments(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
    if (!workspaceId) return;
    try {
      await fetch(`${API_BASE_URL}/api/experiments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch (err) {
      console.error("Failed to update experiment:", err);
    }
  }, [workspaceId]);

  const filtered = experiments.filter(e => {
    if (tab === "active")    return e.status === "active" || e.status === "paused";
    if (tab === "completed") return e.status === "completed";
    return true;
  });

  const active    = experiments.filter(e => e.status === "active").length;
  const completed = experiments.filter(e => e.status === "completed").length;
  const totalLeads= experiments.reduce((s, e) => s + e.audienceSize, 0);
  const winners   = experiments.filter(e => e.winner === "A").length;

  return (
    <div className="pb-10">
      <PageHeader
        title="GTM Stack A/B Testing"
        subtitle="Build two competing tool stacks, run campaigns in parallel, and let the data pick the winner."
      />

      {/* A/B Testing Guide */}
      {guideOpen && <ABTestingGuide onClose={() => setGuideOpen(false)} />}

      {/* ── KPI Bar ── */}
      <section data-tour="ab-kpi-bar" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-6">
        {[
          { label: "Active experiments",  value: active,       icon: FlaskConical, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Completed",           value: completed,    icon: CheckCircle2, color: "text-indigo-400",  bg: "bg-indigo-500/10" },
          { label: "Total leads tested",  value: totalLeads.toLocaleString(), icon: Users, color: "text-sky-400", bg: "bg-sky-500/10" },
          { label: "Stack A wins",        value: `${winners} / ${completed}`,icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                <Icon size={18} className={kpi.color} />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{kpi.value}</div>
                <div className="text-[11px] text-slate-400">{kpi.label}</div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Tabs + Create ── */}
      <div data-tour="ab-controls" className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {([["all", "All"], ["active", "Active"], ["completed", "Completed"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === v ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-300"}`}
            >{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGuideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-600 text-xs font-medium transition-all"
            title="How A/B Testing works"
          >
            <BookOpen size={13} /> Guide
          </button>
          <button
            data-tour="ab-new-btn"
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-sm text-white font-medium hover:bg-indigo-500 transition-all"
          >
            <Plus size={15} /> New Experiment
          </button>
        </div>
      </div>

      {/* ── Experiment List ── */}
      <section data-tour="ab-experiment-list" className="space-y-3">
        {filtered.map(exp => {
          const mA = exp.metricsA;
          const mB = exp.metricsB;

          return (
            <div key={exp.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors overflow-hidden">
              {/* Card Header */}
              <button
                onClick={() => setSelectedId(selectedId === exp.id ? null : exp.id)}
                className="w-full p-5 flex flex-wrap items-center gap-4 text-left"
              >
                <FlaskConical size={16} className="text-indigo-400 shrink-0" />
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-slate-100">{exp.name}</span>
                    <StatusBadge status={exp.status} />
                    {exp.winner && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        exp.winner === "A" ? "text-indigo-300 border-indigo-500/30 bg-indigo-500/10" : "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
                      }`}>
                        <Trophy size={9} /> Stack {exp.winner} won
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {exp.audienceSize} leads · {exp.splitPct}/{100 - exp.splitPct} split · {exp.startDate}
                    {exp.endDate ? ` → ${exp.endDate}` : " · ongoing"}
                  </div>
                </div>

                {/* Quick comparison */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-indigo-400 font-semibold mb-0.5">{exp.stackA.name}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-mono text-slate-200">{mA.replyRate}% reply</div>
                      <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${mA.efficiencyScore}%` }} />
                      </div>
                      <div className="text-[10px] text-slate-400">{mA.efficiencyScore}/100</div>
                    </div>
                  </div>

                  <div className="text-slate-600 text-xs font-bold px-1">vs</div>

                  <div className="text-left">
                    <div className="text-[10px] text-emerald-400 font-semibold mb-0.5">{exp.stackB.name}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] text-slate-400">{mB.efficiencyScore}/100</div>
                      <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${mB.efficiencyScore}%` }} />
                      </div>
                      <div className="text-xs font-mono text-slate-200">{mB.replyRate}% reply</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedId(exp.id); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-all"
                    type="button"
                  >
                    <BarChart3 size={12} /> Full Results
                  </button>
                  <ChevronDown size={15} className={`text-slate-500 transition-transform ${selectedId === exp.id ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Inline mini-comparison */}
              {selectedId === exp.id && (
                <div className="border-t border-slate-800 px-5 py-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {[
                      { label: "Reply Rate",    a: `${mA.replyRate}%`,   b: `${mB.replyRate}%`,   aWins: mA.replyRate > mB.replyRate },
                      { label: "Meeting Rate",  a: `${mA.meetingRate}%`, b: `${mB.meetingRate}%`, aWins: mA.meetingRate > mB.meetingRate },
                      { label: "Revenue",       a: mA.revenue > 0 ? `$${(mA.revenue/1000).toFixed(0)}k` : "—", b: mB.revenue > 0 ? `$${(mB.revenue/1000).toFixed(0)}k` : "—", aWins: mA.revenue >= mB.revenue },
                      { label: "Cost/Lead",     a: `$${mA.costPerLead}`, b: `$${mB.costPerLead}`, aWins: mA.costPerLead <= mB.costPerLead },
                    ].map(m => (
                      <div key={m.label} className="rounded-xl bg-slate-950 border border-slate-800 p-3">
                        <div className="text-[10px] text-slate-500 mb-2">{m.label}</div>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-semibold ${m.aWins ? "text-indigo-300" : "text-slate-500"}`}>{m.a}</span>
                          <span className="text-[10px] text-slate-700">vs</span>
                          <span className={`text-xs font-semibold ${!m.aWins ? "text-emerald-300" : "text-slate-500"}`}>{m.b}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setSelectedId(exp.id); window.scrollTo(0,0); }}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Open full analysis <ArrowRight size={11} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <FlaskConical size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No experiments yet. Create your first A/B test.</p>
          </div>
        )}
      </section>

      {/* ── Full Results Modal ── */}
      {selected && (
        <ExperimentDetail
          exp={selected}
          leads={leads}
          workspaceId={workspaceId}
          onClose={() => setSelectedId(null)}
          onUpdate={patch => handleUpdateExp(selected.id, patch)}
        />
      )}

      {/* ── Create Wizard Modal ── */}
      {creating && (
        <CreateWizard
          leads={leads}
          workspaceId={workspaceId}
          onSave={async exp => {
            if (workspaceId) {
              try {
                const res = await fetch(`${API_BASE_URL}/api/experiments`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...exp, workspaceId }),
                });
                if (res.ok) {
                  const saved = await res.json();
                  setExperiments(prev => [saved, ...prev]);
                  setCreating(false);
                  return;
                }
              } catch (err) {
                console.error("Failed to save experiment:", err);
              }
            }
            setExperiments(prev => [exp, ...prev]);
            setCreating(false);
          }}
          onCancel={() => setCreating(false)}
        />
      )}
    </div>
  );
}
