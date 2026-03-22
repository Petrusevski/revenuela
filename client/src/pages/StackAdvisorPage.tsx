import { useState } from "react";
import PageHeader from "../components/PageHeader";
import {
  Search, Sparkles, Send, Database, CreditCard,
  CheckCircle2, ChevronRight, ChevronLeft, Zap,
  Star, AlertTriangle, TrendingUp, RotateCcw,
  ArrowRight, Info,
} from "lucide-react";

// ─── Tool Database ──────────────────────────────────────────────────────────

type ToolCategory = "prospecting" | "enrichment" | "outreach" | "crm" | "billing";

type Tool = {
  id: string;
  name: string;
  category: ToolCategory;
  tagline: string;
  strengths: string[];
  weaknesses: string[];
  // Scoring weights per input axis (0–10)
  fit: {
    seed: number;        // company stage
    series_a: number;
    growth: number;
    enterprise: number;
    smb_icp: number;     // ICP
    midmarket_icp: number;
    enterprise_icp: number;
    email_channel: number; // outreach channel
    linkedin_channel: number;
    multi_channel: number;
    bootstrap_budget: number; // budget
    growth_budget: number;
    scale_budget: number;
    small_team: number;   // team size (1–3, 4–10, 10+)
    mid_team: number;
    large_team: number;
  };
  monthlyPriceRange: string;
  integrates: string[];  // other tool IDs it pairs well with
};

const TOOLS: Tool[] = [
  // ── Prospecting ──────────────────────────────────────────────────────────
  {
    id: "clay", name: "Clay", category: "prospecting",
    tagline: "AI-powered prospecting waterfall — build lists and enrich in one place.",
    strengths: ["Waterfall enrichment", "No-code flexibility", "Massive data source coverage", "AI personalization"],
    weaknesses: ["Learning curve", "Can get expensive at scale", "Credits-based pricing"],
    fit: {
      seed: 9, series_a: 10, growth: 8, enterprise: 5,
      smb_icp: 8, midmarket_icp: 10, enterprise_icp: 7,
      email_channel: 9, linkedin_channel: 7, multi_channel: 10,
      bootstrap_budget: 6, growth_budget: 10, scale_budget: 7,
      small_team: 9, mid_team: 10, large_team: 6,
    },
    monthlyPriceRange: "$149–$800+",
    integrates: ["lemlist", "heyreach", "hubspot"],
  },
  {
    id: "apollo", name: "Apollo", category: "prospecting",
    tagline: "All-in-one database, enrichment, and sequences for outbound teams.",
    strengths: ["Massive B2B contact DB", "Built-in sequences", "Affordable entry price", "Good filters"],
    weaknesses: ["Data quality varies", "Cluttered UI", "Sequences are basic vs. dedicated tools"],
    fit: {
      seed: 8, series_a: 9, growth: 7, enterprise: 5,
      smb_icp: 9, midmarket_icp: 8, enterprise_icp: 5,
      email_channel: 9, linkedin_channel: 4, multi_channel: 6,
      bootstrap_budget: 10, growth_budget: 8, scale_budget: 5,
      small_team: 10, mid_team: 8, large_team: 5,
    },
    monthlyPriceRange: "$0–$99+",
    integrates: ["hubspot", "lemlist", "instantly"],
  },
  {
    id: "zoominfo", name: "ZoomInfo", category: "prospecting",
    tagline: "Enterprise-grade intent data and contact intelligence platform.",
    strengths: ["Best-in-class intent signals", "Huge DB", "Advanced firmographics", "Great for enterprise ICP"],
    weaknesses: ["Very expensive", "Long contracts", "Overkill for smaller teams"],
    fit: {
      seed: 2, series_a: 4, growth: 7, enterprise: 10,
      smb_icp: 3, midmarket_icp: 7, enterprise_icp: 10,
      email_channel: 7, linkedin_channel: 5, multi_channel: 8,
      bootstrap_budget: 1, growth_budget: 4, scale_budget: 10,
      small_team: 2, mid_team: 6, large_team: 10,
    },
    monthlyPriceRange: "$14,995+/yr",
    integrates: ["hubspot", "salesforce"],
  },
  {
    id: "pdl", name: "People Data Labs", category: "prospecting",
    tagline: "Developer-focused enrichment API with person and company endpoints.",
    strengths: ["Massive person + company API", "GDPR compliant", "Flexible pay-per-record", "High data quality"],
    weaknesses: ["Dev setup required", "No UI — API only", "Not a standalone prospecting tool"],
    fit: {
      seed: 7, series_a: 9, growth: 10, enterprise: 8,
      smb_icp: 7, midmarket_icp: 9, enterprise_icp: 8,
      email_channel: 8, linkedin_channel: 5, multi_channel: 9,
      bootstrap_budget: 7, growth_budget: 9, scale_budget: 10,
      small_team: 6, mid_team: 9, large_team: 10,
    },
    monthlyPriceRange: "$0–custom",
    integrates: ["clay", "hubspot"],
  },
  // ── Enrichment ───────────────────────────────────────────────────────────
  {
    id: "clearbit", name: "Clearbit", category: "enrichment",
    tagline: "Real-time B2B enrichment — emails, firmographics, company data.",
    strengths: ["Real-time enrichment", "Strong API", "Great firmographic coverage", "HubSpot native"],
    weaknesses: ["Acquired by HubSpot (roadmap unclear)", "Pricey at scale"],
    fit: {
      seed: 6, series_a: 9, growth: 10, enterprise: 8,
      smb_icp: 7, midmarket_icp: 10, enterprise_icp: 8,
      email_channel: 10, linkedin_channel: 5, multi_channel: 9,
      bootstrap_budget: 5, growth_budget: 9, scale_budget: 10,
      small_team: 7, mid_team: 10, large_team: 9,
    },
    monthlyPriceRange: "$99–custom",
    integrates: ["hubspot", "clay"],
  },
  {
    id: "lusha", name: "Lusha", category: "enrichment",
    tagline: "Direct dials and verified contact data for sales reps.",
    strengths: ["Chrome extension for fast prospecting", "Good direct dial coverage", "Simple UI", "GDPR compliant"],
    weaknesses: ["Smaller database than Apollo/ZoomInfo", "Credits deplete quickly"],
    fit: {
      seed: 8, series_a: 7, growth: 6, enterprise: 4,
      smb_icp: 9, midmarket_icp: 7, enterprise_icp: 4,
      email_channel: 8, linkedin_channel: 9, multi_channel: 7,
      bootstrap_budget: 8, growth_budget: 7, scale_budget: 4,
      small_team: 10, mid_team: 7, large_team: 4,
    },
    monthlyPriceRange: "$29–$51/seat",
    integrates: ["hubspot", "pipedrive"],
  },
  {
    id: "dropcontact", name: "Dropcontact", category: "enrichment",
    tagline: "GDPR-compliant email finder and enrichment — 100% algorithm-based.",
    strengths: ["Fully GDPR compliant", "No database — algorithms only", "Great for EU companies", "Affordable"],
    weaknesses: ["Slower than API-based tools", "Smaller coverage vs. PDL/Clearbit", "Email-focused only"],
    fit: {
      seed: 8, series_a: 8, growth: 7, enterprise: 5,
      smb_icp: 9, midmarket_icp: 7, enterprise_icp: 4,
      email_channel: 10, linkedin_channel: 4, multi_channel: 6,
      bootstrap_budget: 10, growth_budget: 8, scale_budget: 5,
      small_team: 9, mid_team: 7, large_team: 5,
    },
    monthlyPriceRange: "$24–$149",
    integrates: ["lemlist", "hubspot"],
  },
  // ── Outreach ─────────────────────────────────────────────────────────────
  {
    id: "lemlist", name: "Lemlist", category: "outreach",
    tagline: "Cold email and multi-channel sequences with AI personalization.",
    strengths: ["Best-in-class personalization", "Multi-channel (email + LinkedIn)", "Strong deliverability features", "Built-in warmup"],
    weaknesses: ["Can be complex to set up", "Not pure LinkedIn"],
    fit: {
      seed: 9, series_a: 10, growth: 9, enterprise: 6,
      smb_icp: 9, midmarket_icp: 10, enterprise_icp: 7,
      email_channel: 10, linkedin_channel: 7, multi_channel: 10,
      bootstrap_budget: 7, growth_budget: 10, scale_budget: 8,
      small_team: 8, mid_team: 10, large_team: 7,
    },
    monthlyPriceRange: "$59–$159/seat",
    integrates: ["clay", "hubspot", "pipedrive"],
  },
  {
    id: "heyreach", name: "HeyReach", category: "outreach",
    tagline: "LinkedIn outreach automation at account level — multi-sender.",
    strengths: ["Best LinkedIn automation tool", "Multi-account sending", "Account-level targeting", "Easy to scale"],
    weaknesses: ["LinkedIn only", "Requires active LinkedIn accounts"],
    fit: {
      seed: 8, series_a: 9, growth: 10, enterprise: 7,
      smb_icp: 7, midmarket_icp: 10, enterprise_icp: 9,
      email_channel: 1, linkedin_channel: 10, multi_channel: 7,
      bootstrap_budget: 7, growth_budget: 9, scale_budget: 10,
      small_team: 8, mid_team: 10, large_team: 9,
    },
    monthlyPriceRange: "$79–$999",
    integrates: ["clay", "hubspot"],
  },
  {
    id: "instantly", name: "Instantly.ai", category: "outreach",
    tagline: "Cold email at scale with unlimited inbox warmup.",
    strengths: ["Unlimited sending accounts", "Best for volume cold email", "Built-in warmup", "Affordable"],
    weaknesses: ["Less personalization than Lemlist", "Email only", "Can hurt deliverability if misused"],
    fit: {
      seed: 9, series_a: 8, growth: 7, enterprise: 4,
      smb_icp: 10, midmarket_icp: 7, enterprise_icp: 3,
      email_channel: 10, linkedin_channel: 1, multi_channel: 4,
      bootstrap_budget: 10, growth_budget: 8, scale_budget: 5,
      small_team: 10, mid_team: 8, large_team: 5,
    },
    monthlyPriceRange: "$37–$358",
    integrates: ["apollo", "clay"],
  },
  {
    id: "smartlead", name: "Smartlead.ai", category: "outreach",
    tagline: "Multi-inbox cold email engine with advanced deliverability.",
    strengths: ["Multi-inbox rotation", "Strong deliverability", "Good analytics", "Scalable"],
    weaknesses: ["Less intuitive UI", "Email only"],
    fit: {
      seed: 7, series_a: 8, growth: 9, enterprise: 5,
      smb_icp: 8, midmarket_icp: 9, enterprise_icp: 5,
      email_channel: 10, linkedin_channel: 1, multi_channel: 4,
      bootstrap_budget: 8, growth_budget: 9, scale_budget: 7,
      small_team: 8, mid_team: 9, large_team: 7,
    },
    monthlyPriceRange: "$39–$94",
    integrates: ["clay", "hubspot"],
  },
  // ── CRM ──────────────────────────────────────────────────────────────────
  {
    id: "hubspot", name: "HubSpot CRM", category: "crm",
    tagline: "All-in-one CRM with marketing, sales, and service hubs.",
    strengths: ["Best-in-class free tier", "Rich integrations", "Great reporting", "Scales to enterprise"],
    weaknesses: ["Expensive at scale", "Can be bloated", "Sales Hub pricing jumps fast"],
    fit: {
      seed: 9, series_a: 10, growth: 10, enterprise: 8,
      smb_icp: 9, midmarket_icp: 10, enterprise_icp: 8,
      email_channel: 10, linkedin_channel: 6, multi_channel: 10,
      bootstrap_budget: 9, growth_budget: 10, scale_budget: 7,
      small_team: 9, mid_team: 10, large_team: 8,
    },
    monthlyPriceRange: "$0–$1,600+",
    integrates: ["clay", "lemlist", "heyreach", "clearbit", "stripe"],
  },
  {
    id: "pipedrive", name: "Pipedrive", category: "crm",
    tagline: "Deal-centric CRM built for salespeople.",
    strengths: ["Best pipeline UX", "Affordable", "Easy to customize", "Great for deal-focused teams"],
    weaknesses: ["Limited marketing features", "Weaker reporting than HubSpot", "Smaller ecosystem"],
    fit: {
      seed: 8, series_a: 9, growth: 8, enterprise: 5,
      smb_icp: 9, midmarket_icp: 8, enterprise_icp: 4,
      email_channel: 8, linkedin_channel: 5, multi_channel: 7,
      bootstrap_budget: 9, growth_budget: 9, scale_budget: 6,
      small_team: 9, mid_team: 8, large_team: 5,
    },
    monthlyPriceRange: "$14–$99/seat",
    integrates: ["lemlist", "lusha", "dropcontact"],
  },
  {
    id: "closecrm", name: "Close CRM", category: "crm",
    tagline: "CRM with built-in calling, email, and SMS for inside sales.",
    strengths: ["Built-in power dialer", "Email sequences inside CRM", "Best for inside sales", "Fast UI"],
    weaknesses: ["Less known", "Smaller ecosystem", "Not great for long-cycle enterprise deals"],
    fit: {
      seed: 7, series_a: 9, growth: 8, enterprise: 4,
      smb_icp: 10, midmarket_icp: 8, enterprise_icp: 3,
      email_channel: 10, linkedin_channel: 4, multi_channel: 7,
      bootstrap_budget: 7, growth_budget: 9, scale_budget: 6,
      small_team: 10, mid_team: 8, large_team: 4,
    },
    monthlyPriceRange: "$49–$139/seat",
    integrates: ["apollo", "zapier"],
  },
  // ── Billing ───────────────────────────────────────────────────────────────
  {
    id: "stripe", name: "Stripe", category: "billing",
    tagline: "Developer-first payments and subscription infrastructure.",
    strengths: ["Best developer experience", "Global coverage", "Flexible API", "Huge ecosystem"],
    weaknesses: ["No MoR (you handle tax)", "Can be complex for non-devs"],
    fit: {
      seed: 9, series_a: 10, growth: 10, enterprise: 10,
      smb_icp: 9, midmarket_icp: 10, enterprise_icp: 10,
      email_channel: 8, linkedin_channel: 5, multi_channel: 8,
      bootstrap_budget: 9, growth_budget: 10, scale_budget: 10,
      small_team: 8, mid_team: 10, large_team: 10,
    },
    monthlyPriceRange: "2.9% + 30¢",
    integrates: ["hubspot", "pipedrive"],
  },
  {
    id: "paddle", name: "Paddle", category: "billing",
    tagline: "Merchant of Record — Paddle handles tax, compliance, and billing.",
    strengths: ["Global tax compliance handled", "Great for SaaS", "No billing setup complexity", "Easy international expansion"],
    weaknesses: ["Less flexible than Stripe", "Higher fees", "Less control over checkout UX"],
    fit: {
      seed: 8, series_a: 9, growth: 9, enterprise: 6,
      smb_icp: 8, midmarket_icp: 9, enterprise_icp: 6,
      email_channel: 7, linkedin_channel: 5, multi_channel: 7,
      bootstrap_budget: 8, growth_budget: 9, scale_budget: 7,
      small_team: 9, mid_team: 8, large_team: 6,
    },
    monthlyPriceRange: "5% + 50¢",
    integrates: ["hubspot"],
  },
  {
    id: "chargebee", name: "Chargebee", category: "billing",
    tagline: "Subscription billing, revenue recovery, and SaaS metrics.",
    strengths: ["Best subscription management", "Dunning automation", "SaaS metrics built-in", "Great for complex billing"],
    weaknesses: ["Expensive", "Overkill for early stage", "Needs Stripe underneath"],
    fit: {
      seed: 3, series_a: 6, growth: 9, enterprise: 10,
      smb_icp: 5, midmarket_icp: 8, enterprise_icp: 10,
      email_channel: 7, linkedin_channel: 4, multi_channel: 7,
      bootstrap_budget: 2, growth_budget: 7, scale_budget: 10,
      small_team: 3, mid_team: 8, large_team: 10,
    },
    monthlyPriceRange: "$599–custom",
    integrates: ["stripe", "hubspot", "salesforce"],
  },
];

// ─── Scoring Engine ─────────────────────────────────────────────────────────

type Answers = {
  stage: "seed" | "series_a" | "growth" | "enterprise";
  icp: "smb_icp" | "midmarket_icp" | "enterprise_icp";
  channel: "email_channel" | "linkedin_channel" | "multi_channel";
  budget: "bootstrap_budget" | "growth_budget" | "scale_budget";
  teamSize: "small_team" | "mid_team" | "large_team";
};

function scoreTool(tool: Tool, answers: Answers): number {
  const { stage, icp, channel, budget, teamSize } = answers;
  const f = tool.fit;
  // Weighted average: stage (25%), icp (25%), channel (20%), budget (15%), team (15%)
  return Math.round(
    f[stage] * 0.25 +
    f[icp] * 0.25 +
    f[channel] * 0.20 +
    f[budget] * 0.15 +
    f[teamSize] * 0.15
  );
}

function buildRecommendations(answers: Answers) {
  const categories: ToolCategory[] = ["prospecting", "enrichment", "outreach", "crm", "billing"];
  return categories.map(cat => {
    const ranked = TOOLS
      .filter(t => t.category === cat)
      .map(t => ({ ...t, score: scoreTool(t, answers) }))
      .sort((a, b) => b.score - a.score);
    return { category: cat, top: ranked[0], alternatives: ranked.slice(1, 3) };
  });
}

// ─── Config ─────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ToolCategory, { icon: any; color: string; bg: string; border: string; label: string }> = {
  prospecting: { icon: Search,     color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/30",    label: "Prospecting" },
  enrichment:  { icon: Sparkles,   color: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/30",  label: "Enrichment" },
  outreach:    { icon: Send,       color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/30",  label: "Outreach" },
  crm:         { icon: Database,   color: "text-indigo-400",  bg: "bg-indigo-500/10",  border: "border-indigo-500/30",  label: "CRM" },
  billing:     { icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Billing" },
};

// ─── Step Components ────────────────────────────────────────────────────────

type Option = { id: string; label: string; sub: string };

function OptionGrid({ options, value, onChange }: { options: Option[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`p-4 rounded-xl border text-left transition-all ${
            value === opt.id
              ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_16px_rgba(99,102,241,0.15)]"
              : "border-slate-700 bg-slate-900/60 hover:border-slate-600"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-slate-100">{opt.label}</span>
            {value === opt.id && <CheckCircle2 size={16} className="text-indigo-400" />}
          </div>
          <span className="text-xs text-slate-400">{opt.sub}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

const STEPS = ["Company Stage", "Your ICP", "Outreach Channel", "Budget", "Team Size"];

const STEP_OPTIONS: Record<keyof Answers, Option[]> = {
  stage: [
    { id: "seed",       label: "Seed / Pre-seed",  sub: "Early stage, finding PMF, <$2M raised" },
    { id: "series_a",   label: "Series A",          sub: "Proven model, scaling GTM, $2–10M raised" },
    { id: "growth",     label: "Growth / Series B+",sub: "Scaling fast, large team, $10M+ raised" },
    { id: "enterprise", label: "Enterprise",        sub: "100+ reps, complex stack, $50M+ ARR" },
  ],
  icp: [
    { id: "smb_icp",        label: "SMB",         sub: "1–50 employees, short sales cycle, volume" },
    { id: "midmarket_icp",  label: "Mid-Market",  sub: "50–1000 employees, 30–90 day cycle" },
    { id: "enterprise_icp", label: "Enterprise",  sub: "1000+ employees, long cycle, procurement" },
  ],
  channel: [
    { id: "email_channel",    label: "Email-First",     sub: "Cold email is primary outreach channel" },
    { id: "linkedin_channel", label: "LinkedIn-First",  sub: "LinkedIn DMs and connections dominate" },
    { id: "multi_channel",    label: "Multi-Channel",   sub: "Email + LinkedIn + calls combined" },
  ],
  budget: [
    { id: "bootstrap_budget", label: "Bootstrap",   sub: "< $1,000/mo on tools" },
    { id: "growth_budget",    label: "Growth",      sub: "$1,000–$5,000/mo on tools" },
    { id: "scale_budget",     label: "Scale",       sub: "$5,000+/mo, enterprise contracts OK" },
  ],
  teamSize: [
    { id: "small_team", label: "Solo / Small",  sub: "1–3 people running GTM" },
    { id: "mid_team",   label: "Growing Team",  sub: "4–10 people in sales & marketing" },
    { id: "large_team", label: "Large Team",    sub: "10+ reps, RevOps, dedicated ops" },
  ],
};

const STEP_KEYS: (keyof Answers)[] = ["stage", "icp", "channel", "budget", "teamSize"];

const STEP_DESCRIPTIONS: Record<keyof Answers, string> = {
  stage:    "What stage is your company at right now?",
  icp:      "Who are you selling to?",
  channel:  "What's your primary outreach motion?",
  budget:   "What's your monthly GTM tool budget?",
  teamSize: "How large is your GTM team?",
};

export default function StackAdvisorPage() {
  const [step, setStep]           = useState(0);
  const [answers, setAnswers]     = useState<Partial<Answers>>({});
  const [results, setResults]     = useState<ReturnType<typeof buildRecommendations> | null>(null);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const currentKey   = STEP_KEYS[step];
  const currentValue = answers[currentKey] ?? "";
  const isLast       = step === STEPS.length - 1;
  function handleNext() {
    if (!currentValue) return;
    if (isLast) {
      setResults(buildRecommendations(answers as Answers));
    } else {
      setStep(s => s + 1);
    }
  }

  function handleReset() {
    setStep(0);
    setAnswers({});
    setResults(null);
    setExpandedTool(null);
  }

  // ── Results View ──
  if (results) {
    const totalFitScore = Math.round(results.reduce((s, r) => s + (r.top.score ?? 0), 0) / results.length * 10);
    return (
      <div className="pb-10">
        <PageHeader
          title="Your Recommended GTM Stack"
          subtitle="Analysis complete — here's the optimal tool stack based on your profile."
        />

        {/* Stack Summary */}
        <div className="mt-6 mb-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-indigo-300 uppercase tracking-wider mb-1">Overall Stack Fit Score</div>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-white">{totalFitScore}</span>
                <span className="text-slate-400 text-sm">/100</span>
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={14} className={i <= Math.round(totalFitScore / 20) ? "text-amber-400 fill-amber-400" : "text-slate-700"} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {results.map(r => {
                const cfg = CATEGORY_CONFIG[r.category];
                const Icon = cfg.icon;
                return (
                  <div key={r.category} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                    <Icon size={12} className={cfg.color} />
                    <span className="text-xs font-semibold text-slate-200">{r.top.name}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:text-white hover:border-slate-600 transition-all">
              <RotateCcw size={14} /> Re-run Analysis
            </button>
          </div>
        </div>

        {/* Tool Cards */}
        <div className="space-y-4">
          {results.map(result => {
            const cfg = CATEGORY_CONFIG[result.category];
            const Icon = cfg.icon;
            const tool = result.top;
            const isExpanded = expandedTool === tool.id;
            const fitPct = Math.min(tool.score * 10, 100);

            return (
              <div key={result.category} className={`rounded-2xl border bg-slate-900/60 overflow-hidden transition-all ${cfg.border}`}>
                {/* Header */}
                <button
                  onClick={() => setExpandedTool(isExpanded ? null : tool.id)}
                  className="w-full p-5 flex flex-wrap items-center gap-4 hover:bg-slate-800/30 transition-colors text-left"
                >
                  {/* Category */}
                  <div className={`p-2.5 rounded-xl ${cfg.bg} shrink-0`}>
                    <Icon size={18} className={cfg.color} />
                  </div>

                  {/* Tool Info */}
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-[10px] text-slate-600">→</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white">{tool.name}</span>
                      <span className="text-xs text-slate-400">{tool.monthlyPriceRange}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{tool.tagline}</p>
                  </div>

                  {/* Fit Score */}
                  <div className="flex items-center gap-4 min-w-[160px]">
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-500">Fit score</span>
                        <span className={`font-semibold ${cfg.color}`}>{tool.score}/10</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700`}
                          style={{ width: `${fitPct}%`, backgroundColor: cfg.color.includes("cyan") ? "#22d3ee" : cfg.color.includes("orange") ? "#f97316" : cfg.color.includes("indigo") ? "#6366f1" : cfg.color.includes("emerald") ? "#10b981" : "#a855f7" }}
                        />
                      </div>
                    </div>
                    <ChevronRight size={16} className={`text-slate-500 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Strengths / Weaknesses */}
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <TrendingUp size={11} /> Why it fits your profile
                      </div>
                      <ul className="space-y-2">
                        {tool.strengths.map(s => (
                          <li key={s} className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />{s}
                          </li>
                        ))}
                      </ul>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 mt-4 flex items-center gap-1.5">
                        <AlertTriangle size={11} /> Watch out for
                      </div>
                      <ul className="space-y-2">
                        {tool.weaknesses.map(w => (
                          <li key={w} className="flex items-start gap-2 text-xs text-slate-400">
                            <Info size={12} className="text-amber-400 mt-0.5 shrink-0" />{w}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Pairs well with */}
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Pairs well with</div>
                      <div className="space-y-2">
                        {tool.integrates.map(tid => {
                          const paired = TOOLS.find(t => t.id === tid);
                          if (!paired) return null;
                          const pcfg = CATEGORY_CONFIG[paired.category];
                          const PIcon = pcfg.icon;
                          return (
                            <div key={tid} className={`flex items-center gap-2 p-2 rounded-lg border ${pcfg.border} ${pcfg.bg}`}>
                              <PIcon size={12} className={pcfg.color} />
                              <span className="text-xs text-slate-200 font-medium">{paired.name}</span>
                              <span className={`text-[10px] ${pcfg.color} ml-auto`}>{pcfg.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Alternatives */}
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Alternatives considered</div>
                      <div className="space-y-3">
                        {result.alternatives.map(alt => (
                          <div key={alt.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold text-slate-200">{alt.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">fit: {alt.score}/10</span>
                            </div>
                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-600 rounded-full" style={{ width: `${alt.score * 10}%` }} />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2">{alt.tagline}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Connect CTA */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-1">Connect your recommended tools</h3>
            <p className="text-xs text-slate-400">Head to Integrations to hook up your stack and start recording events.</p>
          </div>
          <a
            href="/integrations"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-sm text-white font-medium hover:bg-indigo-500 transition-colors"
          >
            Go to Integrations <ArrowRight size={14} />
          </a>
        </div>
      </div>
    );
  }

  // ── Wizard View ──
  return (
    <div className="pb-10">
      <PageHeader
        title="GTM Stack Advisor"
        subtitle="Answer 5 questions — we'll analyze and recommend the optimal tool stack for your motion."
      />

      {/* Progress */}
      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < step ? "bg-indigo-500 w-10" : i === step ? "bg-indigo-400 w-16" : "bg-slate-800 w-10"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500">{step + 1} / {STEPS.length}</span>
        </div>
        <div className="flex gap-1 text-[11px]">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={i === step ? "text-slate-200 font-semibold" : i < step ? "text-indigo-400" : "text-slate-600"}
            >
              {s}{i < STEPS.length - 1 && <span className="mx-2 text-slate-700">·</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="max-w-2xl">
        <div className="mb-1">
          <span className="text-[11px] text-indigo-400 font-semibold uppercase tracking-wider">Step {step + 1}</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-6">{STEP_DESCRIPTIONS[currentKey]}</h2>

        <OptionGrid
          options={STEP_OPTIONS[currentKey]}
          value={currentValue as string}
          onChange={(v) => setAnswers(prev => ({ ...prev, [currentKey]: v as any }))}
        />

        <div className="flex items-center gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:border-slate-600 transition-all"
            >
              <ChevronLeft size={15} /> Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!currentValue}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-sm text-white font-medium hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isLast ? (
              <><Zap size={15} /> Analyze My Stack</>
            ) : (
              <>Next <ChevronRight size={15} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
