import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Database,
  Mail,
  Briefcase,
  CreditCard,
  ArrowRight,
  ChevronRight,
  Fingerprint,
  CheckCircle2,
  Play,
  Pause,
  Ear,
  GitMerge,
  Eye,
  AlertTriangle,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

// ── Tool logo ──────────────────────────────────────────────────────────────────
function ToolLogo({ domain, name, size = 7 }: { domain: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  const px = size * 4;
  if (err) return (
    <div style={{ width: px, height: px }} className="rounded-lg bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
      {name[0]}
    </div>
  );
  return (
    <div style={{ width: px, height: px }} className="rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
      <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} alt={name} width={px * 0.6} height={px * 0.6} className="object-contain" onError={() => setErr(true)} />
    </div>
  );
}

// ── Workflow stages ────────────────────────────────────────────────────────────
const STAGES = [
  {
    id: "source",
    step: "01",
    label: "Source",
    icon: Search,
    color: "violet",
    accent: "#8b5cf6",
    tagline: "iqpipe captures every sourcing signal the moment it fires",
    description: "Clay, Apollo, and ZoomInfo pull lists, scrape profiles, and import CSVs. The moment any of them fires an event, iqpipe captures it and mints a Universal ID — permanently linking every downstream signal from every tool to the same contact identity, automatically.",
    eventsLabel: "Events iqpipe captures",
    events: ["lead_imported", "list_uploaded", "prospect_created", "row_scraped"],
    tools: [
      { name: "Clay",          domain: "clay.com"          },
      { name: "Apollo",        domain: "apollo.io"         },
      { name: "ZoomInfo",      domain: "zoominfo.com"      },
      { name: "PhantomBuster", domain: "phantombuster.com" },
    ],
    what: "iqpipe mints a Universal ID on the first sourcing event it captures for a contact. Every tool that touches that person later — enrichment, outreach, CRM, billing — is automatically linked to that same ID. One person, one record, across your entire stack. No code. No manual tagging.",
  },
  {
    id: "enrich",
    step: "02",
    label: "Enrich",
    icon: Database,
    color: "fuchsia",
    accent: "#d946ef",
    tagline: "iqpipe tracks enrichment freshness across every data source",
    description: "Clearbit, PDL, Hunter, Lusha, and Cognism append verified emails, phone numbers, and firmographics. iqpipe captures every enrichment event, recording the source, the timestamp, and the contact ID — so enrichment freshness is tracked automatically across your entire stack.",
    eventsLabel: "Events iqpipe captures",
    events: ["record_enriched", "email_verified", "phone_appended", "company_matched"],
    tools: [
      { name: "Clearbit",  domain: "clearbit.com"      },
      { name: "PDL",       domain: "peopledatalabs.com" },
      { name: "Hunter.io", domain: "hunter.io"          },
      { name: "Lusha",     domain: "lusha.com"          },
      { name: "Cognism",   domain: "cognism.com"        },
    ],
    what: "iqpipe tracks enrichment freshness per contact across all your data providers. When an enrichment event arrives, it logs the source and timestamp. Workflow Health automatically surfaces staleness alerts when a record hasn't received a new enrichment signal in 90+ days — before you reach out with bad data.",
  },
  {
    id: "activate",
    step: "03",
    label: "Activate",
    icon: Mail,
    color: "sky",
    accent: "#0ea5e9",
    tagline: "iqpipe captures every send, open, and reply across all outreach tools",
    description: "HeyReach sequences LinkedIn. Instantly runs email campaigns. iqpipe captures every outreach event they fire — every send, open, reply, bounce — across all active tools simultaneously. That cross-tool view lets iqpipe detect when two tools are contacting the same lead at the same time, something no single tool can see.",
    eventsLabel: "Events iqpipe captures",
    events: ["connection_sent", "email_sent", "reply_received", "meeting_booked", "email_opened"],
    tools: [
      { name: "HeyReach",  domain: "heyreach.io"  },
      { name: "Instantly", domain: "instantly.ai"  },
      { name: "Smartlead", domain: "smartlead.ai"  },
      { name: "Lemlist",   domain: "lemlist.com"   },
      { name: "Expandi",   domain: "expandi.io"    },
    ],
    what: "iqpipe watches outreach events across every tool in your stack simultaneously. When it sees two tools actively targeting the same Universal ID on the same day, it fires an overlap alarm in Pipeline Health — catching multi-tool collisions before they damage deliverability or burn a prospect.",
  },
  {
    id: "qualify",
    step: "04",
    label: "Qualify & Track",
    icon: Briefcase,
    color: "emerald",
    accent: "#10b981",
    tagline: "iqpipe stitches every deal back to the journey that created it",
    description: "HubSpot, Pipedrive, and Salesforce log the deals. iqpipe captures every stage change event and links each deal to the Universal ID — connecting the opportunity all the way back to the sourcing tool, enrichment source, and outreach sequence that generated the reply. Attribution is automatic, never manual.",
    eventsLabel: "Events iqpipe captures",
    events: ["deal_created", "deal_updated", "deal_won", "deal_lost", "stage_changed"],
    tools: [
      { name: "HubSpot",    domain: "hubspot.com"    },
      { name: "Pipedrive",  domain: "pipedrive.com"  },
      { name: "Salesforce", domain: "salesforce.com" },
      { name: "Attio",      domain: "attio.com"      },
    ],
    what: "iqpipe stitches every deal event to the full upstream journey via the Universal ID. Any closed deal is traceable to its exact source — which Clay table, which HeyReach campaign, which subject line got the reply. Full attribution surfaces automatically in the GTM Report.",
  },
  {
    id: "close",
    step: "05",
    label: "Close & Attribute",
    icon: CreditCard,
    color: "amber",
    accent: "#f59e0b",
    tagline: "iqpipe traces every dollar back to the stack that earned it",
    description: "Stripe and Chargebee fire billing events. iqpipe captures each payment and links it to the Universal ID — tracing the revenue all the way back through CRM, outreach, enrichment, and sourcing in a single chain. No tracking code. No attribution spreadsheets.",
    eventsLabel: "Events iqpipe captures",
    events: ["payment_succeeded", "subscription_created", "invoice_paid", "mrr_updated"],
    tools: [
      { name: "Stripe",    domain: "stripe.com"    },
      { name: "Chargebee", domain: "chargebee.com" },
    ],
    what: "iqpipe attributes every payment to the full GTM motion that generated it. The GTM Report shows exactly which tool combination drove which revenue — Clay + HeyReach drove $84K, Apollo + email-only drove $31K. Now you know where every dollar came from and where to invest next.",
  },
];

const COLOR_CLASSES: Record<string, { text: string; bg: string; border: string; pill: string }> = {
  violet:  { text: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/30",  pill: "bg-violet-500/10 border-violet-500/20 text-violet-300"  },
  fuchsia: { text: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/30", pill: "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-300" },
  sky:     { text: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/30",     pill: "bg-sky-500/10 border-sky-500/20 text-sky-300"             },
  emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", pill: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" },
  amber:   { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   pill: "bg-amber-500/10 border-amber-500/20 text-amber-300"       },
};

// ── Animated event dot flowing upward into iqpipe ──────────────────────────────
function FlowDot({ color, delay }: { color: string; delay: number }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full shadow-lg"
      style={{ backgroundColor: color, left: "50%", translateX: "-50%", top: 0 }}
      animate={{ top: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.4, delay, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
    />
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function GTMStackPage() {
  const [active, setActive] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(() => setActive((p) => (p + 1) % STAGES.length), 4000);
    return () => clearInterval(t);
  }, [autoPlay]);

  const stage = STAGES[active];
  const c = COLOR_CLASSES[stage.color];
  const Icon = stage.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <Header />

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative border-b border-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-indigo-500/8 blur-[100px] pointer-events-none" />
          <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-20 text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-medium text-indigo-300 mb-6">
                <Ear size={11} /> iqpipe listens — your tools run
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-5">
                Your tools automate.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-400">
                  iqpipe listens to all of it.
                </span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
                iqpipe is the event layer that sits across your entire GTM stack. Every signal your tools fire — every import, send, reply, deal move, and payment — flows into iqpipe, gets normalized into one neutral schema, and gets linked to a single contact identity. The result: a unified, real-time picture of your revenue motion that no individual tool can produce.
              </p>
              <div className="flex items-center justify-center gap-4">
                <a href="/signup" className="inline-flex items-center gap-2 bg-white text-slate-950 px-6 py-3 rounded-full font-bold text-sm hover:bg-slate-100 transition-all shadow-lg">
                  Connect your stack <ArrowRight size={15} />
                </a>
                <a href="/integrations" className="inline-flex items-center gap-2 border border-slate-700 text-slate-300 px-6 py-3 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all">
                  See all 38 integrations
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Architecture explainer ── */}
        <section className="border-b border-slate-900 py-16 px-4 bg-slate-950/60">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-xl font-bold text-white mb-2">How iqpipe fits into your stack</h2>
              <p className="text-slate-400 text-sm max-w-lg mx-auto">You don't replace anything. iqpipe sits quietly alongside your existing tools and receives the events they already fire.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 items-center">
              {/* Left: your tools */}
              <div className="space-y-3">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-4 text-center md:text-left">Your tools — they run the automation</div>
                {[
                  { name: "Clay", domain: "clay.com", event: "lead_imported" },
                  { name: "HeyReach", domain: "heyreach.io", event: "connection_sent" },
                  { name: "HubSpot", domain: "hubspot.com", event: "deal_created" },
                  { name: "Stripe", domain: "stripe.com", event: "payment_succeeded" },
                ].map((t) => (
                  <motion.div
                    key={t.name}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/50"
                  >
                    <ToolLogo domain={t.domain} name={t.name} size={5} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-300">{t.name}</div>
                      <code className="text-[10px] text-slate-500 font-mono">{t.event}</code>
                    </div>
                    <ArrowRight size={12} className="text-indigo-400 shrink-0" />
                  </motion.div>
                ))}
              </div>

              {/* Center: iqpipe */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-2 ring-indigo-500/40 flex items-center justify-center">
                    <Fingerprint size={36} className="text-indigo-400" />
                  </div>
                  <motion.div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Ear size={10} className="text-white" />
                  </motion.div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-indigo-300">iqpipe</div>
                  <div className="text-[11px] text-slate-500">event layer · universal schema</div>
                </div>
                <div className="space-y-1.5 text-center">
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider">receives all events</div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider">normalizes to one schema</div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider">resolves identity across tools</div>
                </div>
              </motion.div>

              {/* Right: what you get */}
              <div className="space-y-3">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-4 text-center md:text-left">What iqpipe gives you in return</div>
                {[
                  { icon: Eye, label: "Live Feed", desc: "Every event, in real time" },
                  { icon: GitMerge, label: "Contact Inspector", desc: "Full cross-tool journey per lead" },
                  { icon: AlertTriangle, label: "Pipeline Health", desc: "Tool outages & overlap alarms" },
                  { icon: CheckCircle2, label: "GTM Report", desc: "Revenue attributed to each tool" },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/50"
                    >
                      <ItemIcon size={14} className="text-indigo-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-300">{item.label}</div>
                        <div className="text-[10px] text-slate-500">{item.desc}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Why tell iqpipe your stack ── */}
        <section className="border-b border-slate-900 py-16 px-4">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white mb-3">What iqpipe gives you when you connect your stack</h2>
              <p className="text-slate-400 text-sm max-w-xl mx-auto">
                Every tool you connect unlocks a deeper layer of visibility. Here's what iqpipe surfaces the moment your events start flowing in.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  icon: Ear,
                  color: "indigo",
                  title: "iqpipe knows what silence means",
                  body: "Connect your stack and iqpipe learns exactly what event volume to expect from each tool. When a tool stops firing events during business hours, Pipeline Health immediately surfaces a 'tool silent' alarm — so you catch outages before they cost you pipeline.",
                },
                {
                  icon: GitMerge,
                  color: "fuchsia",
                  title: "One identity across every tool",
                  body: "iqpipe resolves contact identity across your entire stack. Clay's email address, HeyReach's LinkedIn URL, and HubSpot's contact ID all collapse into a single Universal ID — so one person is tracked as one person, everywhere, from first import to closed revenue.",
                },
                {
                  icon: AlertTriangle,
                  color: "amber",
                  title: "Cross-tool overlap detection",
                  body: "iqpipe sees outreach events from all your tools at once. When HeyReach and Instantly are both sequencing the same prospect on the same day, iqpipe raises an overlap alarm in Pipeline Health — the kind of collision no individual tool can see.",
                },
                {
                  icon: CheckCircle2,
                  color: "emerald",
                  title: "Full source-to-close attribution",
                  body: "iqpipe traces every closed deal from the Stripe payment event all the way back to the Clay row that started the journey — through enrichment, outreach, and CRM in a single unbroken chain. Attribution that used to take hours of spreadsheet work surfaces automatically.",
                },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-4 bg-${item.color}-500/10 border border-${item.color}-500/20`}>
                      <ItemIcon size={15} className={`text-${item.color}-400`} />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.body}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Interactive workflow ── */}
        <section className="py-20 px-4">
          <div className="mx-auto max-w-6xl">

            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">What iqpipe captures at each stage</h2>
              <p className="text-slate-400 text-sm max-w-lg mx-auto">Select a stage to see which events flow into iqpipe, which tools fire them, and what iqpipe surfaces from those signals.</p>
            </div>

            {/* Stage selector */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {STAGES.map((s, i) => {
                const sc = COLOR_CLASSES[s.color];
                const SIcon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setActive(i); setAutoPlay(false); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${
                      active === i
                        ? `${sc.bg} ${sc.border} ${sc.text}`
                        : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span className="text-[10px] font-mono opacity-60">{s.step}</span>
                    <SIcon size={13} />
                    {s.label}
                  </button>
                );
              })}
              <button
                onClick={() => setAutoPlay((p) => !p)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium border transition-all ${
                  autoPlay ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-slate-800 text-slate-600"
                }`}
              >
                {autoPlay ? <><Pause size={11} /> Auto</> : <><Play size={11} /> Auto</>}
              </button>
            </div>

            {/* Stage detail panel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="grid lg:grid-cols-[1fr_380px] gap-8"
              >
                {/* Left: detail */}
                <div className={`rounded-2xl border ${c.border} ${c.bg} p-8`}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${c.border} ${c.bg}`}>
                      <Icon size={18} className={c.text} />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Stage {stage.step}</div>
                      <div className="text-lg font-bold text-white">{stage.label}</div>
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed mb-6">{stage.description}</p>

                  {/* Events */}
                  <div className="mb-6">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{stage.eventsLabel}</div>
                    <div className="flex flex-wrap gap-2">
                      {stage.events.map((ev) => (
                        <code key={ev} className={`text-[11px] px-2 py-1 rounded-lg border font-mono ${c.pill}`}>{ev}</code>
                      ))}
                    </div>
                  </div>

                  {/* Tools */}
                  <div className="mb-6">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Tools that fire these events</div>
                    <div className="flex flex-wrap gap-3">
                      {stage.tools.map((t) => (
                        <div key={t.name} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/60">
                          <ToolLogo domain={t.domain} name={t.name} size={5} />
                          <span className="text-xs font-medium text-slate-300">{t.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* iqpipe what it does */}
                  <div className={`flex gap-3 p-4 rounded-xl border ${c.border} ${c.bg}`}>
                    <Ear size={16} className={`${c.text} shrink-0 mt-0.5`} />
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">What iqpipe does with these events</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{stage.what}</p>
                    </div>
                  </div>
                </div>

                {/* Right: pipeline visualization */}
                <div className="space-y-3">
                  {STAGES.map((s, i) => {
                    const sc = COLOR_CLASSES[s.color];
                    const SIcon = s.icon;
                    const isActive = i === active;
                    return (
                      <button
                        key={s.id}
                        onClick={() => { setActive(i); setAutoPlay(false); }}
                        className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                          isActive ? `${sc.border} ${sc.bg}` : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
                        }`}
                      >
                        {/* Connector */}
                        <div className="flex flex-col items-center self-stretch shrink-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isActive ? `${sc.border} ${sc.bg}` : "border-slate-800 bg-slate-900"}`}>
                            <SIcon size={14} className={isActive ? sc.text : "text-slate-600"} />
                          </div>
                          {i < STAGES.length - 1 && (
                            <div className="relative w-px flex-1 bg-slate-800 mt-2 overflow-hidden" style={{ minHeight: 16 }}>
                              {isActive && <FlowDot color={s.accent} delay={0} />}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-slate-600">{s.step}</span>
                            <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-slate-400"}`}>{s.label}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{s.tagline}</p>
                          {isActive && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {s.tools.slice(0, 3).map((t) => (
                                <span key={t.name} className="text-[9px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-500">{t.name}</span>
                              ))}
                              {s.tools.length > 3 && <span className="text-[9px] text-slate-600">+{s.tools.length - 3}</span>}
                            </div>
                          )}
                        </div>

                        {isActive && <ChevronRight size={14} className={sc.text} />}
                      </button>
                    );
                  })}

                  {/* iqpipe hub */}
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 mt-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-1 ring-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                      <Ear size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-indigo-300">iqpipe — across every stage</div>
                      <div className="text-[10px] text-slate-500">One Universal ID. One neutral schema. Full picture.</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ── How it connects ── */}
        <section className="border-t border-slate-900 py-20 px-4">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-white mb-3">Tell iqpipe your stack. It listens to the rest.</h2>
              <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
                Three steps. No code. Your tools keep running exactly as they do today.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  title: "Tell iqpipe which tools you use",
                  body: "In iqpipe settings, select the tools in your stack at each stage. iqpipe maps your workflow — so it knows what events to expect, from which tools, at what frequency.",
                  color: "indigo",
                  code: "Source: Clay, Apollo\nActivate: HeyReach, Instantly\nCRM: HubSpot · Billing: Stripe",
                },
                {
                  step: "2",
                  title: "Your tools emit events — iqpipe receives them",
                  body: "Your tools run as normal. When they fire events — a lead imported, a message sent, a deal closed — those events arrive in iqpipe via webhook or native integration. iqpipe is passive. It doesn't trigger or control anything.",
                  color: "fuchsia",
                  code: '{ "event": "lead_imported",\n  "source": "clay",\n  "iq_id": "iq_4f2a9c" }',
                },
                {
                  step: "3",
                  title: "One unified event stream across your stack",
                  body: "Every event from every tool lands in one neutral schema. iqpipe resolves identity across tools, detects anomalies, and surfaces Live Feed, Contact Inspector, Pipeline Health, and GTM Report automatically.",
                  color: "emerald",
                  code: "iq_4f2a9c → 8 events across 5 tools\nSource: Clay → Close: Stripe $18,400",
                },
              ].map((card) => (
                <motion.div
                  key={card.step}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
                >
                  <div className={`text-xs font-bold text-${card.color}-400 mb-4 flex items-center gap-2`}>
                    <span className={`w-6 h-6 rounded-full bg-${card.color}-500/10 border border-${card.color}-500/20 flex items-center justify-center text-[11px]`}>{card.step}</span>
                    Step {card.step}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{card.body}</p>
                  <code className="block text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg whitespace-pre leading-relaxed">
                    {card.code}
                  </code>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What iqpipe gives you per stage ── */}
        <section className="border-t border-slate-900 py-20 px-4 bg-slate-950/60">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-white text-center mb-3">Insights iqpipe surfaces at every stage</h2>
            <p className="text-slate-400 text-sm text-center max-w-lg mx-auto mb-10">Connect your stack and these insights appear automatically — no dashboards to build, no tracking code to write.</p>
            <div className="space-y-3">
              {[
                { stage: "Source",          gain: "Know which sourcing tool generates leads that actually close — not just which tool creates the most volume.",   icon: Search,     color: "violet"  },
                { stage: "Enrich",          gain: "Freshness alerts when enrichment data is 90+ days old. Stop reaching out with stale emails and wrong numbers.", icon: Database,   color: "fuchsia" },
                { stage: "Activate",        gain: "Overlap detection fires when two tools are contacting the same prospect simultaneously. Catch it before it hurts deliverability.", icon: Mail, color: "sky" },
                { stage: "Qualify & Track", gain: "Every deal is automatically traced to its exact source. Attribution without any manual tagging or custom UTMs.",  icon: Briefcase,  color: "emerald" },
                { stage: "Close",           gain: "Revenue is attributed to the stack combination that earned it. Know your actual ROI per tool pairing.",           icon: CreditCard, color: "amber"   },
              ].map((row) => {
                const RowIcon = row.icon;
                const rc = COLOR_CLASSES[row.color];
                return (
                  <motion.div
                    key={row.stage}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/40"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${rc.border} ${rc.bg}`}>
                      <RowIcon size={15} className={rc.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider mr-3 ${rc.text}`}>{row.stage}</span>
                      <span className="text-sm text-slate-300">{row.gain}</span>
                    </div>
                    <CheckCircle2 size={15} className="text-slate-700 shrink-0" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 px-4 text-center border-t border-slate-900">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <div className="flex justify-center mb-5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-1 ring-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Ear size={28} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Keep your tools. Add visibility.</h2>
            <p className="text-slate-400 mb-2 leading-relaxed">
              Your tools keep running exactly as they do today. iqpipe just listens — and shows you what's actually happening across all of them.
            </p>
            <p className="text-slate-500 text-sm mb-8">No automations replaced. No workflows changed. One listener added.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/signup" className="inline-flex items-center gap-2 bg-white text-slate-950 px-8 py-4 rounded-full font-bold hover:bg-slate-100 transition-all shadow-xl">
                Start free — no card needed <ArrowRight size={16} />
              </a>
              <a href="/integrations" className="inline-flex items-center gap-2 border border-slate-700 text-slate-300 px-8 py-4 rounded-full font-semibold hover:bg-slate-800 transition-all">
                View all 38 integrations
              </a>
            </div>
          </motion.div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
