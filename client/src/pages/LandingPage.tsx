import { useEffect, useState } from "react";import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Database,
  Search,
  Mail,
  Briefcase,
  Fingerprint,
  ArrowRight,
  CheckCircle2,
  Zap,
  Globe,
  ShieldCheck,
  Clock,
  TrendingUp,
  
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

// --- PRECISE GEOMETRY CONFIGURATION ---
const CARD_HEIGHT = 64;
const GAP = 20;
const MASTER_WIDTH = 180;
const STACK_WIDTH = 240;
const CONNECTOR_SPAN = 120;
const TOTAL_ITEMS = 5;
const TOTAL_HEIGHT = (CARD_HEIGHT * TOTAL_ITEMS) + (GAP * (TOTAL_ITEMS - 1));
const MASTER_HEIGHT = 140;
const MASTER_Y_CENTER = TOTAL_HEIGHT / 2;

// --- SUB-COMPONENTS (Visualizations) ---

const LiveIdTicker = () => {
  const [id, setId] = useState("9F3A");
  
  useEffect(() => {
    const interval = setInterval(() => {
      setId(Math.random().toString(36).substring(2, 6).toUpperCase());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-3 flex items-center gap-2 rounded bg-slate-900/80 px-3 py-1.5 text-[10px] font-mono text-emerald-400 border border-slate-800/60 shadow-inner">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="ml-1"
        >
          Minting RVN-{id}...
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

const StackNode = ({ icon: Icon, label, sub, color, top, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.6, type: "spring" }}
    style={{ top: top, height: CARD_HEIGHT, width: STACK_WIDTH }}
    className="absolute right-0 z-20 flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/80 p-3 shadow-xl backdrop-blur-md hover:border-slate-600 hover:bg-slate-900 transition-all group"
  >
    <div className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-slate-950 border-2 border-slate-700 group-hover:border-slate-500 transition-colors" />
    <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 ${color} shadow-sm group-hover:scale-105 transition-transform`}>
      <Icon size={18} className="text-current" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="truncate text-sm font-semibold text-slate-200 group-hover:text-white">{label}</div>
      <div className="truncate text-[11px] text-slate-400">{sub}</div>
    </div>
  </motion.div>
);

const MasterNode = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    style={{ 
      top: MASTER_Y_CENTER - (MASTER_HEIGHT / 2), 
      width: MASTER_WIDTH,
      height: MASTER_HEIGHT 
    }}
    className="absolute left-0 z-30 flex flex-col items-center justify-center rounded-2xl border border-indigo-500/40 bg-slate-950 p-4 shadow-[0_0_50px_-10px_rgba(99,102,241,0.25)]"
  >
    <div className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-indigo-500 ring-4 ring-slate-950 z-30" />
    <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-2xl -z-10" />
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 ring-1 ring-indigo-500/40 shadow-lg">
      <Fingerprint size={32} />
    </div>
    <div className="text-base font-bold text-white tracking-tight">Revenuela</div>
    <LiveIdTicker />
  </motion.div>
);

const BiDirectionalBeam = ({ startY, endY, delay, colorStr }: { startY: number, endY: number, delay: number, colorStr: string }) => {
  const startX = MASTER_WIDTH; 
  const endX = MASTER_WIDTH + CONNECTOR_SPAN;
  const cp1X = startX + (CONNECTOR_SPAN * 0.55);
  const cp2X = endX - (CONNECTOR_SPAN * 0.55);
  const pathD = `M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`;

  return (
    <>
      <path d={pathD} fill="none" stroke="#1e293b" strokeWidth="1.5" className="opacity-40" />
      <motion.path 
        d={pathD} 
        fill="none" 
        stroke="url(#outbound-grad)" 
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="10 100" 
        initial={{ strokeDashoffset: 200 }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 2, ease: "linear", repeat: Infinity, delay: delay }}
      />
      <motion.path 
        d={pathD} 
        fill="none" 
        stroke={colorStr} 
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="4 150" 
        initial={{ strokeDashoffset: -154 }} 
        animate={{ strokeDashoffset: 0 }} 
        transition={{ duration: 3, ease: "linear", repeat: Infinity, delay: delay + 1 }}
        style={{ filter: "drop-shadow(0px 0px 2px currentColor)" }}
      />
    </>
  );
};

const HeroVisualization = () => {
  const steps = [
    { icon: Search, label: "Clay / Apollo", sub: "1. Prospecting", color: "text-sky-400", stroke: "#38bdf8" },
    { icon: Database, label: "Clearbit / ZoomInfo", sub: "2. Enrichment", color: "text-indigo-400", stroke: "#818cf8" },
    { icon: Mail, label: "HeyReach / Lemlist", sub: "3. Outbound", color: "text-fuchsia-400", stroke: "#e879f9" },
    { icon: Briefcase, label: "HubSpot CRM", sub: "4. Deal Mgmt", color: "text-orange-400", stroke: "#fb923c" },
    { icon: CreditCard, label: "Stripe", sub: "5. Revenue", color: "text-emerald-400", stroke: "#34d399" },
  ];

  return (
    <div className="relative mx-auto select-none" style={{ width: MASTER_WIDTH + CONNECTOR_SPAN + STACK_WIDTH, height: TOTAL_HEIGHT }}>
      <svg className="absolute inset-0 h-full w-full pointer-events-none overflow-visible z-10">
        <defs>
          <linearGradient id="outbound-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {steps.map((step, index) => {
          const targetY = (index * (CARD_HEIGHT + GAP)) + (CARD_HEIGHT / 2);
          return (
            <BiDirectionalBeam 
              key={index} 
              startY={MASTER_Y_CENTER} 
              endY={targetY} 
              delay={index * 0.15} 
              colorStr={step.stroke}
            />
          );
        })}
      </svg>
      <MasterNode />
      {steps.map((step, index) => {
        const topPosition = index * (CARD_HEIGHT + GAP);
        return (
          <StackNode key={index} {...step} top={topPosition} delay={0.3 + (index * 0.1)} />
        );
      })}
    </div>
  );
};

// --- NEW COMPONENT: JOURNEY TRACE (Styled for Strip Layout) ---
const JourneyTrace = () => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-6 font-mono text-xs relative overflow-hidden shadow-2xl">
    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-emerald-900/20" />
    
    {/* Header Card */}
    <div className="flex items-center justify-between mb-8 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Revenuela ID</div>
        <div className="text-white font-bold text-sm">RVN-LEAD-9F3A2C</div>
      </div>
      <div className="text-right">
         <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Outcome</div>
         <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <CheckCircle2 size={14} />
            <span>€149 MRR</span>
         </div>
      </div>
    </div>

    {/* Timeline */}
    <div className="space-y-0 relative pl-2">
      {/* Vertical Line */}
      <div className="absolute left-[27px] top-2 bottom-8 w-px bg-slate-800" />

      {[
        { time: "10:03", label: "Clay row imported", source: "Clay", icon: Database },
        { time: "10:05", label: "ID synced to HeyReach", source: "Revenuela", icon: Zap },
        { time: "11:12", label: "Positive reply received", source: "HeyReach", icon: Mail, highlight: true },
        { time: "13:45", label: "Deal won in CRM", source: "HubSpot", icon: Briefcase },
        { time: "13:47", label: "Subscription created", source: "Stripe", icon: CreditCard, final: true }
      ].map((step, i) => (
        <div key={i} className="relative flex items-center gap-4 pb-7 last:pb-0 group">
          <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${step.final ? 'border-emerald-500 bg-emerald-950 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-slate-800 bg-slate-900 text-slate-400'} group-hover:scale-110 group-hover:border-indigo-500/50 transition-all duration-300`}>
            <step.icon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-0.5">
                <span className={`font-medium truncate pr-2 ${step.highlight ? 'text-indigo-300' : step.final ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {step.label}
                </span>
                <span className="text-slate-600 text-[10px] whitespace-nowrap">{step.time}</span>
            </div>
            <div className="text-slate-500 text-[10px]">{step.source}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- NEW COMPONENT: WORKFLOW COMPARISON (Styled for Strip Layout) ---
const WorkflowComparison = () => (
  <div className="space-y-4 w-full">
    {[
      { name: "Clay → HeyReach → CRM", mrr: "€3,950", customers: 18, rate: "24% Reply", winner: true },
      { name: "Apollo → Lemlist → CRM", mrr: "€1,680", customers: 11, rate: "16% Reply", winner: false },
      { name: "ZoomInfo → Instantly → CRM", mrr: "€890", customers: 5, rate: "9% Reply", winner: false },
    ].map((flow, i) => (
      <div key={i} className={`group relative overflow-hidden p-4 rounded-xl border transition-all duration-300 ${flow.winner ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-transparent' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}>
        
        {/* Progress Bar Background for Winners */}
        {flow.winner && (
           <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 w-full opacity-50" />
        )}

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
            {flow.winner ? <TrendingUp size={16} className="text-emerald-400" /> : <div className="w-4" />}
            {flow.name}
          </div>
          <div className={`text-sm font-bold font-mono ${flow.winner ? 'text-emerald-400' : 'text-slate-500'}`}>
            {flow.mrr}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-slate-500 pl-6">
            <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className={flow.winner ? "text-emerald-500/70" : "text-slate-700"} />
                {flow.customers} customers
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-800" />
            <div>{flow.rate}</div>
        </div>
      </div>
    ))}
  </div>
);

// --- NEW COMPONENT: STOCK TICKER ---
const StockTicker = () => {
  const tickerItems = [
    { tool: "HeyReach", text: "Positive reply received", id: "9F3A2C", color: "text-fuchsia-400" },
    { tool: "Clay", text: "42 rows imported", id: "AB912F", color: "text-sky-400" },
    { tool: "System", text: "ID synced to Lemlist", id: "7B91DE", color: "text-slate-400" },
    { tool: "Apollo", text: "List imported (87 leads)", id: "3C71BF", color: "text-orange-400" },
    { tool: "Stripe", text: "Subscription Created ($49/mo)", id: "5C28AF", color: "text-emerald-400" },
    { tool: "HubSpot", text: "Deal Stage: Negotiation", id: "D192KA", color: "text-orange-500" },
    { tool: "Smartlead", text: "Email Opened (3x)", id: "991LKA", color: "text-blue-400" },
    { tool: "Paddle", text: "Invoice Paid ($299)", id: "M10293", color: "text-emerald-400" },
  ];

  return (
    <div className="w-full overflow-hidden bg-slate-950 border-b border-slate-900/50 py-3">
      <motion.div 
        className="flex gap-4 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
        style={{ width: "max-content" }}
      >
        {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
          <div key={i} className="inline-flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5 text-xs shadow-sm">
            <span className={`font-bold ${item.color}`}>{item.tool}</span>
            <span className="text-slate-300 font-medium">{item.text}</span>
            <span className="font-mono text-slate-600 pl-2 border-l border-slate-800">RVN-{item.id}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200 font-sans overflow-x-hidden">
      <Header />

      <main className="flex-1">
        
        {/* --- HERO SECTION --- */}
        <section className="relative border-b border-slate-900/50 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full opacity-50 pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-24 md:pt-24 md:pb-32 grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-2 z-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 mb-6 text-xs font-medium text-indigo-300 backdrop-blur-sm hover:bg-indigo-500/20 transition-colors cursor-default"
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Public Beta 2.0
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-white"
              >
                One schema to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                  unify your GTM.
                </span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-slate-400 mb-8 leading-relaxed"
              >
                Revenuela acts as the central nervous system for your stack. We mint a <span className="text-slate-200 font-semibold">Universal ID</span> for every prospect and track their journey across every tool you use.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-4"
              >
                <a href="/signup" className="inline-flex h-12 items-center justify-center rounded-xl bg-white text-slate-950 px-6 text-sm font-bold shadow-xl shadow-indigo-500/20 hover:bg-slate-100 hover:scale-105 transition-all">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <a href="/demo" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/50 px-6 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all backdrop-blur-sm">
                  Live demo
                </a>
              </motion.div>
              <div className="mt-10 flex items-center gap-4 text-sm text-slate-500">
                <p className="uppercase tracking-wider text-[10px] font-semibold">Works with</p>
                <div className="flex gap-3 opacity-60 grayscale transition-all hover:grayscale-0">
                   <span className="font-bold text-slate-300">Clay</span>
                   <span className="font-bold text-slate-300">HubSpot</span>
                   <span className="font-bold text-slate-300">Stripe</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 relative flex justify-center lg:justify-end mt-8 lg:mt-0 pointer-events-none select-none">
               <div className="scale-[0.8] sm:scale-90 md:scale-100 origin-top lg:origin-right">
                  <HeroVisualization />
               </div>
            </div>
          </div>
        </section>

        {/* --- LIVE STOCK TICKER --- */}
        <StockTicker />

        {/* --- FEATURES (REDESIGNED STRIP LAYOUT) --- */}
        <section id="features" className="bg-slate-950 py-20 md:py-32 relative">
          {/* Decorator Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-slate-800 to-transparent" />

          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-20 md:text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
                Stop flying blind.
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Spreadsheets break. APIs change. Revenuela gives you a permanent source of truth for every dollar in your pipeline.
              </p>
            </div>
            
            <div className="space-y-24 md:space-y-32">
              
              {/* FEATURE 1: JOURNEY TRACE (Text Left / Visual Right) */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                 <div className="order-2 md:order-1">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/20 text-emerald-400">
                      <Clock />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">Trace Every Dollar</h3>
                    <p className="text-slate-400 text-lg leading-relaxed mb-6">
                      "Where did this deal come from?" <br/>
                      Stop guessing. Revenuela stitches the exact timestamped journey of every closed-won deal. From the first row in Clay to the final invoice in Stripe.
                    </p>
                    <ul className="space-y-3 text-slate-300 mb-8">
                       <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500" /> Works across multiple email addresses</li>
                       <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500" /> Tracks prospects switching companies</li>
                       <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500" /> Immune to cookie blockers</li>
                    </ul>
                 </div>
                 <div className="order-1 md:order-2 relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-[80px] rounded-full opacity-20" />
                    <JourneyTrace />
                 </div>
              </div>

              {/* FEATURE 2: WORKFLOW WARS (Visual Left / Text Right) */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                 <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full opacity-20" />
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-8 backdrop-blur-sm">
                        <WorkflowComparison />
                    </div>
                 </div>
                 <div>
                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 border border-indigo-500/20 text-indigo-400">
                      <TrendingUp />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">Workflow Wars</h3>
                    <p className="text-slate-400 text-lg leading-relaxed mb-6">
                      You run different motions: Clay for enrichment, Apollo for volume, inbound for brand. But which one actually prints money?
                    </p>
                    <p className="text-slate-400 text-lg leading-relaxed mb-6">
                       Revenuela compares them side-by-side based on <strong className="text-white">Revenue per Lead</strong> and <strong className="text-white">Sales Cycle Velocity</strong>.
                    </p>
                    <a href="/demo" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold group">
                       See the dashboard <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                 </div>
              </div>

              {/* FEATURE 3: GRID (ROI / Security / Sync) */}
              <div className="grid md:grid-cols-3 gap-6">
                 
                 {/* Card 3.1: ROI */}
                 <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 hover:border-slate-700 transition-all">
                    <Globe className="text-fuchsia-400 mb-4" size={28} />
                    <h4 className="text-xl font-bold text-white mb-2">Tool ROI</h4>
                    <p className="text-slate-400 text-sm mb-4">Stop paying for tools that don't convert. Measure specific contribution to pipeline.</p>
                    <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
                       <div className="flex justify-between"><span>Clay Source</span> <span className="text-emerald-400 font-mono">€3,950</span></div>
                       <div className="flex justify-between"><span>Apollo Source</span> <span className="text-emerald-400 font-mono">€1,680</span></div>
                    </div>
                 </div>

                 {/* Card 3.2: Native Sync */}
                 <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 hover:border-slate-700 transition-all">
                    <Zap className="text-amber-400 mb-4" size={28} />
                    <h4 className="text-xl font-bold text-white mb-2">Native Sync</h4>
                    <p className="text-slate-400 text-sm mb-4">Keep using the tools you love. We just read the data via API & Webhooks.</p>
                    <div className="flex flex-wrap gap-2">
                       {['Clay','HubSpot','Stripe','HeyReach','Lemlist'].map(t => (
                          <span key={t} className="px-2 py-1 rounded bg-slate-800 text-[10px] text-slate-300">{t}</span>
                       ))}
                    </div>
                 </div>

                 {/* Card 3.3: Security */}
                 <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 hover:border-slate-700 transition-all">
                    <ShieldCheck className="text-sky-400 mb-4" size={28} />
                    <h4 className="text-xl font-bold text-white mb-2">SOC-2 Ready</h4>
                    <p className="text-slate-400 text-sm">
                       Enterprise-grade encryption. We only store metadata (IDs & Timestamps), keeping your PII secure in your own CRM.
                    </p>
                 </div>

              </div>

            </div>
          </div>
        </section>

        {/* --- PRICING SECTION --- */}
        <section id="pricing" className="relative bg-slate-950 py-20 border-t border-slate-900">
           <div className="mx-auto max-w-4xl text-center px-4">
              <h2 className="text-3xl font-bold text-white mb-6">Start with a 30-day free trial</h2>
              <p className="text-slate-400 mb-10">Connect your tools in 15 minutes. See value in 24 hours.</p>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
                 
                 {/* GROWTH PLAN */}
                 <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/20 flex flex-col h-full">
                    <div className="text-lg font-semibold text-white mb-2">Growth</div>
                    <div className="text-4xl font-bold text-white mb-6">$29<span className="text-sm text-slate-500 font-normal">/mo</span></div>
                    
                    <ul className="space-y-3 text-sm text-slate-400 flex-1">
                       <li className="flex gap-3"><CheckCircle2 size={18} className="text-indigo-500 shrink-0"/> <span><strong>3 Seats</strong> included</span></li>
                       <li className="flex gap-3"><CheckCircle2 size={18} className="text-indigo-500 shrink-0"/> <span><strong>2 Active</strong> Workspaces</span></li>
                       <li className="flex gap-3"><CheckCircle2 size={18} className="text-indigo-500 shrink-0"/> <span><strong>Standard</strong> Tool Comparison</span></li>
                       <li className="flex gap-3"><CheckCircle2 size={18} className="text-indigo-500 shrink-0"/> <span>Basic Journey Timeline</span></li>
                       <li className="flex gap-3"><CheckCircle2 size={18} className="text-indigo-500 shrink-0"/> <span>Email Support</span></li>
                    </ul>
                    
                    <a href="/signup?plan=growth" className="mt-8 block w-full rounded-xl border border-slate-700 bg-slate-800 py-3 text-center text-sm font-bold text-white hover:bg-slate-700 transition-colors">
                      Start Trial
                    </a>
                 </div>

                 {/* SCALE PLAN */}
                 <div className="p-8 rounded-3xl border border-indigo-500/40 bg-indigo-500/5 relative overflow-hidden flex flex-col h-full shadow-2xl shadow-indigo-500/10">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                    <div className="absolute top-4 right-4 text-[10px] uppercase font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full tracking-wide">Most Popular</div>
                    
                    <div className="text-lg font-semibold text-white mb-2">Scale</div>
                    <div className="text-4xl font-bold text-white mb-6">$299<span className="text-sm text-slate-500 font-normal">/mo</span></div>
                    
                    <ul className="space-y-3 text-sm text-slate-300 flex-1">
                       <li className="flex gap-3"><CheckCircle2 size={18} className="text-emerald-400 shrink-0"/> <span><strong>Unlimited</strong> Seats & Workspaces</span></li>
                       <li className="flex gap-3"><CheckCircle2 size={18} className="text-emerald-400 shrink-0"/> <span><strong>Advanced</strong> Attribution Models</span></li>
                       <li className="flex gap-3"><CheckCircle2 size={18} className="text-emerald-400 shrink-0"/> <span><strong>Workflow ROI</strong> Intelligence</span></li>
                       <li className="flex gap-3"><CheckCircle2 size={18} className="text-emerald-400 shrink-0"/> <span>Full Journey History (Unlimited)</span></li>
                       <li className="flex gap-3"><CheckCircle2 size={18} className="text-emerald-400 shrink-0"/> <span>API Access & Webhooks</span></li>
                       <li className="flex gap-3"><CheckCircle2 size={18} className="text-emerald-400 shrink-0"/> <span>Priority 24/7 Support</span></li>
                    </ul>

                    <a href="/signup?plan=scale" className="mt-8 block w-full rounded-xl bg-white py-3 text-center text-sm font-bold text-slate-950 hover:bg-slate-100 transition-colors shadow-lg">
                      Start Trial
                    </a>
                 </div>

              </div>
           </div>
        </section>

        {/* --- FINAL CTA --- */}
        <section className="py-20 bg-slate-950 border-t border-slate-900">
           <div className="mx-auto max-w-3xl px-4 text-center">
              <h2 className="text-4xl font-bold text-white mb-8">Ready to fix your funnel?</h2>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                 <a href="/signup" className="inline-flex h-14 items-center justify-center rounded-full bg-white text-slate-950 px-10 text-base font-bold shadow-xl hover:bg-slate-100 transition-all">
                  Get started now
                </a>
              </div>
           </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}