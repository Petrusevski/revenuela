import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText, RefreshCw, Pencil, Check, X,
  AlertTriangle, CheckCircle2, TrendingDown,
  Database, Sparkles, Zap, Server, CreditCard, BarChart3,
  ChevronRight, ChevronLeft, Download, Linkedin, Image,
  Calendar, ChevronDown,
} from "lucide-react";
import { API_BASE_URL } from "../../config";
import SeedBanner from "../components/SeedBanner";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface StackTool { tool: string; label: string; }

interface ReportData {
  workspace: { name: string };
  period: string;
  stack: Record<string, StackTool[]>;
  pipeline: { sourced: number; enriched: number; contacted: number; replied: number; meetings: number; dealsWon: number };
  metrics: { openRate: number|null; replyRate: number|null; unsubRate: number|null; bounceRate: number|null; meetingRate: number|null; emailsSent: number; totalPipelineValue: number };
  signals: { event: string; count: number; tier: number }[];
}

interface ManualMetrics {
  domainReputation: "high" | "medium" | "low" | "";
  positiveReplyRate: string;
  showUpRate: string;
  bounceRateOverride: string;
}

type Period = "7d" | "30d" | "90d" | "all";
const PERIOD_LABELS: Record<Period, string> = { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days", "all": "All time" };

// ─────────────────────────────────────────────────────────────────────────────
// REPORT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_CFG: Record<string, { label: string; icon: typeof Database; color: string }> = {
  aggregation:    { label: "Aggregation",    icon: Database,  color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  enrichment:     { label: "Enrichment",     icon: Sparkles,  color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  activation:     { label: "Activation",     icon: Zap,       color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  crm:            { label: "CRM",            icon: BarChart3, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  billing:        { label: "Billing",        icon: CreditCard,color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  infrastructure: { label: "Infrastructure", icon: Server,    color: "text-slate-400 bg-slate-700/30 border-slate-700" },
};

const TIER_CFG = [
  { tier: 1, label: "High Intent",       desc: "Already showing buying signals",  color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" },
  { tier: 2, label: "Warm Signals",      desc: "Context events — personalize",    color: "text-amber-400 border-amber-500/30 bg-amber-500/5" },
  { tier: 3, label: "Cold but Targeted", desc: "Precision targeting, no signal",  color: "text-blue-400 border-blue-500/30 bg-blue-500/5" },
  { tier: 4, label: "Experimental",      desc: "Test in small batches",           color: "text-slate-500 border-slate-700 bg-slate-800/30" },
];

interface Benchmark { good: [number,number]; warn: [number,number]; goodLabel: string; higher: boolean; }
const BENCHMARKS: Record<string, Benchmark> = {
  bounceRate:  { good:[0,2],    warn:[2,5],    goodLabel:"< 2%",    higher:false },
  unsubRate:   { good:[0,0.5],  warn:[0.5,1],  goodLabel:"< 0.5%",  higher:false },
  openRate:    { good:[40,100], warn:[20,40],  goodLabel:"40-60%",  higher:true  },
  replyRate:   { good:[3,100],  warn:[1,3],    goodLabel:"3-8%",    higher:true  },
  meetingRate: { good:[10,100], warn:[5,10],   goodLabel:"> 10%",   higher:true  },
};

function benchStatus(key: string, v: number|null): "good"|"warn"|"bad"|"none" {
  if (v === null) return "none";
  const b = BENCHMARKS[key]; if (!b) return "none";
  if (b.higher ? v >= b.good[0] : v <= b.good[1]) return "good";
  if (b.higher ? v >= b.warn[0] : v <= b.warn[1]) return "warn";
  return "bad";
}
const S_COLOR = { good:"text-emerald-400", warn:"text-amber-400", bad:"text-rose-400", none:"text-slate-500" };
const S_BG    = { good:"bg-emerald-500/10 border-emerald-500/20", warn:"bg-amber-500/10 border-amber-500/20", bad:"bg-rose-500/10 border-rose-500/20", none:"bg-slate-800/50 border-slate-700" };

function MetricCard({ label, value, unit, bKey, note }: { label:string; value:number|null; unit:string; bKey:string; note?:string }) {
  const s = benchStatus(bKey, value);
  const b = BENCHMARKS[bKey];
  return (
    <div className={`rounded-xl border p-3 ${S_BG[s]}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] text-slate-500 leading-tight">{label}</span>
        <span className={`text-lg font-bold tabular-nums ${S_COLOR[s]}`}>{value !== null ? `${value}${unit}` : "—"}</span>
      </div>
      {b && (
        <div className="mt-1 flex items-center gap-1">
          {s==="good"&&<CheckCircle2 size={10} className="text-emerald-400"/>}
          {s==="warn"&&<AlertTriangle size={10} className="text-amber-400"/>}
          {s==="bad" &&<TrendingDown  size={10} className="text-rose-400"/>}
          <span className={`text-[10px] ${S_COLOR[s]}`}>{s==="good"?`Target: ${b.goodLabel}`:s==="warn"?"Near threshold":s==="bad"?`Below target (${b.goodLabel})`:"No data"}</span>
        </div>
      )}
      {note && <p className="text-[10px] text-slate-700 mt-1">{note}</p>}
    </div>
  );
}

function EditableMetric({ label, value, unit, onChange }: { label:string; value:string; unit:string; onChange:(v:string)=>void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  const commit = () => { onChange(draft); setEditing(false); };
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="flex items-center gap-1.5">
        {editing ? (
          <>
            <input ref={ref} value={draft} onChange={e=>setDraft(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}}
              className="w-16 bg-slate-800 border border-indigo-500/60 rounded px-1.5 py-0.5 text-xs text-white outline-none tabular-nums"/>
            <button onClick={commit} className="text-emerald-400"><Check size={11}/></button>
            <button onClick={()=>setEditing(false)} className="text-slate-600"><X size={11}/></button>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold text-white tabular-nums">{value||"—"}{value&&unit}</span>
            <button onClick={()=>{setDraft(value);setEditing(true);}} className="text-slate-700 hover:text-slate-500"><Pencil size={10}/></button>
          </>
        )}
      </div>
    </div>
  );
}

function PipelineStep({ label, count, total, color, isLast }: { label:string; count:number; total:number; color:string; isLast?:boolean }) {
  const pct = total > 0 ? Math.round((count/total)*100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center gap-1 min-w-[72px]">
        <div className={`text-xl font-bold tabular-nums ${color}`}>{count.toLocaleString()}</div>
        <div className="text-[10px] text-slate-500 text-center leading-tight">{label}</div>
        {total>0&&count!==total&&<div className="text-[10px] text-slate-700">{pct}%</div>}
      </div>
      {!isLast && <ChevronRight size={13} className="text-slate-700 shrink-0"/>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS DRAWING (LinkedIn cards)
// ─────────────────────────────────────────────────────────────────────────────

const CV = 1080;
const CC = { bg:"#0f172a", bg2:"#1e293b", muted:"#334155", text:"#f8fafc", sub:"#94a3b8", dim:"#64748b", accent:"#6366f1", accent2:"#818cf8", good:"#10b981", warn:"#f59e0b", purple:"#a855f7", sky:"#38bdf8" };

function csf(ctx: CanvasRenderingContext2D, size: number, weight: number|string=400) {
  ctx.font = `${weight} ${size}px "Inter","Segoe UI","SF Pro Display",system-ui,sans-serif`;
}
function crr(ctx: CanvasRenderingContext2D, x:number, y:number, w:number, h:number, r:number) {
  const rad = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rad,y); ctx.arcTo(x+w,y,x+w,y+h,rad); ctx.arcTo(x+w,y+h,x,y+h,rad);
  ctx.arcTo(x,y+h,x,y,rad); ctx.arcTo(x,y,x+w,y,rad); ctx.closePath();
}
function cnoise(ctx: CanvasRenderingContext2D) {
  ctx.save(); ctx.globalAlpha=0.025; ctx.fillStyle="#fff";
  for(let gx=0;gx<CV;gx+=40) for(let gy=0;gy<CV;gy+=40) { ctx.beginPath(); ctx.arc(gx,gy,1,0,Math.PI*2); ctx.fill(); }
  ctx.restore();
}
function cstripe(ctx: CanvasRenderingContext2D) {
  const g=ctx.createLinearGradient(0,0,CV,0);
  g.addColorStop(0,CC.accent); g.addColorStop(0.5,CC.purple); g.addColorStop(1,CC.sky);
  ctx.fillStyle=g; ctx.fillRect(0,0,CV,6);
}
function cbrand(ctx: CanvasRenderingContext2D, x:number, y:number) {
  crr(ctx,x,y-22,26,26,6); ctx.fillStyle=CC.accent; ctx.fill();
  ctx.fillStyle="#fff"; csf(ctx,13,800); ctx.textAlign="left"; ctx.fillText("iq",x+4,y-2);
  ctx.fillStyle=CC.text; csf(ctx,20,700); ctx.fillText("iqpipe",x+34,y-2);
}
function cfooter(ctx: CanvasRenderingContext2D, workspace:string) {
  ctx.fillStyle=CC.muted; ctx.fillRect(0,CV-72,CV,72);
  ctx.fillStyle=CC.bg2;   ctx.fillRect(0,CV-73,CV,1);
  cbrand(ctx,48,CV-26);
  const dt=new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  ctx.fillStyle=CC.dim; csf(ctx,17,400); ctx.textAlign="center";
  ctx.fillText(`${workspace} · ${dt}`,CV/2,CV-26);
  ctx.textAlign="right"; ctx.fillText("iqpipe.com",CV-48,CV-26); ctx.textAlign="left";
}
function cheader(ctx: CanvasRenderingContext2D, title:string, workspace:string) {
  ctx.fillStyle=CC.bg2; ctx.fillRect(0,6,CV,138);
  cbrand(ctx,48,50);
  ctx.fillStyle=CC.dim; csf(ctx,17,400); ctx.textAlign="right"; ctx.fillText(workspace,CV-48,50); ctx.textAlign="left";
  ctx.fillStyle=CC.text; csf(ctx,50,800); ctx.fillText(title,48,118);
}
function cbase(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle=CC.bg; ctx.fillRect(0,0,CV,CV); cnoise(ctx); cstripe(ctx);
}

function drawMetrics(canvas: HTMLCanvasElement, data: ReportData) {
  const ctx=canvas.getContext("2d")!; canvas.width=canvas.height=CV;
  cbase(ctx);
  ctx.fillStyle=CC.bg2; ctx.fillRect(0,6,CV,190);
  cbrand(ctx,48,58);
  csf(ctx,17,500); const pw=ctx.measureText(data.period).width+28;
  crr(ctx,CV-48-pw,38,pw,28,14); ctx.fillStyle=CC.accent+"33"; ctx.fill();
  ctx.fillStyle=CC.accent2; ctx.textAlign="right"; ctx.fillText(data.period,CV-48-14,57); ctx.textAlign="left";
  ctx.fillStyle=CC.text; csf(ctx,52,800); ctx.fillText("GTM Performance",48,135);
  ctx.fillStyle=CC.sub; csf(ctx,24,400); ctx.fillText(data.workspace.name,48,173);

  const p=data.pipeline;
  const conv=p.sourced>0?((p.dealsWon/p.sourced)*100).toFixed(2)+"%":"—";
  const pv=data.metrics.totalPipelineValue>0?"$"+(data.metrics.totalPipelineValue>=1000?Math.round(data.metrics.totalPipelineValue/1000)+"K":data.metrics.totalPipelineValue):"—";
  const tiles=[
    {label:"Leads Sourced",value:p.sourced.toLocaleString(),  color:CC.accent2, sub:"imported & enriched"},
    {label:"Reply Rate",   value:data.metrics.replyRate!=null?data.metrics.replyRate+"%":"—", color:data.metrics.replyRate!=null&&data.metrics.replyRate>=3?CC.good:CC.warn, sub:"target: 3-8%"},
    {label:"Meetings",     value:p.meetings.toLocaleString(),  color:CC.good,    sub:"booked from outreach"},
    {label:"Open Rate",    value:data.metrics.openRate!=null?data.metrics.openRate+"%":"—",   color:data.metrics.openRate!=null&&data.metrics.openRate>=40?CC.good:CC.warn, sub:"target: 40-60%"},
    {label:"Source → Won", value:conv,                         color:CC.accent2, sub:p.dealsWon+" deals closed"},
    {label:"Pipeline",     value:pv,                           color:CC.good,    sub:"total value"},
  ];
  const cols=3,padX=40,gapX=14,gapY=12,boxW=(CV-padX*2-gapX*(cols-1))/cols,boxH=190,startY=210;
  tiles.forEach((t,i)=>{
    const col=i%cols,row=Math.floor(i/cols),bx=padX+col*(boxW+gapX),by=startY+row*(boxH+gapY);
    crr(ctx,bx,by,boxW,boxH,14); ctx.fillStyle=CC.bg2; ctx.fill();
    crr(ctx,bx,by,boxW,4,2); ctx.fillStyle=t.color; ctx.fill();
    ctx.fillStyle=t.color; csf(ctx,62,800); ctx.fillText(t.value,bx+20,by+82);
    ctx.fillStyle=CC.text; csf(ctx,19,600); ctx.fillText(t.label,bx+20,by+116);
    ctx.fillStyle=CC.dim;  csf(ctx,15,400); ctx.fillText(t.sub,bx+20,by+140);
  });
  cfooter(ctx,data.workspace.name);
}

function drawFunnel(canvas: HTMLCanvasElement, data: ReportData) {
  const ctx=canvas.getContext("2d")!; canvas.width=canvas.height=CV;
  cbase(ctx); cheader(ctx,"Pipeline Funnel",data.workspace.name);
  const p=data.pipeline;
  const stages=[
    {label:"Sourced",  count:p.sourced,   base:p.sourced,   color:CC.accent},
    {label:"Enriched", count:p.enriched,  base:p.sourced,   color:CC.accent2},
    {label:"Contacted",count:p.contacted, base:p.sourced,   color:CC.sky},
    {label:"Replied",  count:p.replied,   base:p.contacted, color:CC.warn},
    {label:"Meeting",  count:p.meetings,  base:p.replied,   color:CC.good},
    {label:"Won",      count:p.dealsWon,  base:p.meetings,  color:"#fbbf24"},
  ];
  const max=p.sourced||1,barMaxW=550,barH=54,barGap=12,barX=310,startY=165;
  stages.forEach((s,i)=>{
    const y=startY+i*(barH+barGap),bw=Math.max(8,Math.round((s.count/max)*barMaxW));
    ctx.fillStyle=CC.sub; csf(ctx,20,500); ctx.textAlign="right"; ctx.fillText(s.label,barX-18,y+35); ctx.textAlign="left";
    crr(ctx,barX,y,barMaxW,barH,8); ctx.fillStyle=CC.muted+"55"; ctx.fill();
    crr(ctx,barX,y,bw,barH,8);
    const g=ctx.createLinearGradient(barX,0,barX+bw,0); g.addColorStop(0,s.color); g.addColorStop(1,s.color+"88");
    ctx.fillStyle=g; ctx.fill();
    ctx.fillStyle=CC.text; csf(ctx,20,700); ctx.fillText(s.count.toLocaleString(),barX+barMaxW+16,y+35);
    if(i>0&&s.base>0){
      const pct=Math.round((s.count/s.base)*100),col=pct>=50?CC.good:pct>=20?CC.warn:"#f43f5e";
      crr(ctx,barX+barMaxW+110,y+12,70,30,8); ctx.fillStyle=col+"33"; ctx.fill();
      ctx.fillStyle=col; csf(ctx,17,700); ctx.textAlign="center"; ctx.fillText(pct+"%",barX+barMaxW+145,y+32); ctx.textAlign="left";
    }
  });
  const conv=p.sourced>0?((p.dealsWon/p.sourced)*100).toFixed(2):"0.00";
  const callY=startY+stages.length*(barH+barGap)+16;
  crr(ctx,48,callY,CV-96,74,14);
  const cg=ctx.createLinearGradient(48,callY,CV-96,callY); cg.addColorStop(0,CC.accent+"22"); cg.addColorStop(1,"#fbbf2422");
  ctx.fillStyle=cg; ctx.fill();
  ctx.fillStyle=CC.sub; csf(ctx,19,400); ctx.fillText("Overall Source → Won",70,callY+26);
  ctx.fillStyle=CC.text; csf(ctx,32,800); ctx.fillText(conv+"%",70,callY+60);
  ctx.fillStyle="#fbbf24"; csf(ctx,28,800); ctx.textAlign="right"; ctx.fillText(p.dealsWon+" deals won",CV-70,callY+60); ctx.textAlign="left";
  cfooter(ctx,data.workspace.name);
}

function drawStack(canvas: HTMLCanvasElement, data: ReportData) {
  const ctx=canvas.getContext("2d")!; canvas.width=canvas.height=CV;
  cbase(ctx); cheader(ctx,"GTM Stack",data.workspace.name);
  const cats=[
    {key:"aggregation",   label:"Aggregation",   color:CC.purple, icon:"◆"},
    {key:"enrichment",    label:"Enrichment",     color:CC.sky,    icon:"◈"},
    {key:"activation",    label:"Activation",     color:CC.warn,   icon:"▶"},
    {key:"crm",           label:"CRM",            color:CC.good,   icon:"◉"},
    {key:"billing",       label:"Billing",        color:"#fbbf24", icon:"◎"},
    {key:"infrastructure",label:"Infrastructure", color:CC.sub,    icon:"◐"},
  ].filter(c=>(data.stack[c.key]??[]).length>0);
  const padX=48,contentH=CV-80-162,catH=cats.length>0?Math.min(130,Math.floor(contentH/cats.length)-8):130;
  let curY=162;
  if(cats.length===0){ctx.fillStyle=CC.dim;csf(ctx,26,400);ctx.textAlign="center";ctx.fillText("No tools connected",CV/2,420);ctx.textAlign="left";}
  else {
    for(const cat of cats){
      const tools=data.stack[cat.key]??[];
      if(curY+catH>CV-90) break;
      crr(ctx,padX,curY,CV-padX*2,catH,12); ctx.fillStyle=cat.color+"18"; ctx.fill();
      ctx.fillStyle=cat.color; csf(ctx,13,700); ctx.fillText(`${cat.icon} ${cat.label.toUpperCase()}`,padX+16,curY+22);
      let pillX=padX+180; const pillH=28,pillPad=14,pillGap=8,pillY=curY+(catH-pillH)/2;
      for(const tool of tools){
        csf(ctx,15,600); const tw=ctx.measureText(tool.label).width+pillPad*2;
        if(pillX+tw>CV-padX-8) break;
        crr(ctx,pillX,pillY,tw,pillH,pillH/2); ctx.fillStyle=CC.bg2; ctx.fill();
        crr(ctx,pillX,pillY,tw,pillH,pillH/2); ctx.strokeStyle=cat.color+"55"; ctx.lineWidth=1.5; ctx.stroke();
        ctx.fillStyle=CC.text; ctx.fillText(tool.label,pillX+pillPad,pillY+19); pillX+=tw+pillGap;
      }
      curY+=catH+8;
    }
  }
  const total=cats.reduce((s,c)=>s+(data.stack[c.key]?.length??0),0);
  if(total>0&&curY<CV-140){
    const banY=CV-142; crr(ctx,padX,banY,CV-padX*2,50,10); ctx.fillStyle=CC.muted+"88"; ctx.fill();
    ctx.fillStyle=CC.sub; csf(ctx,18,400); ctx.fillText(`${total} tool${total!==1?"s":""} connected across your GTM stack`,padX+18,banY+31);
  }
  cfooter(ctx,data.workspace.name);
}

function drawSignals(canvas: HTMLCanvasElement, data: ReportData) {
  const ctx=canvas.getContext("2d")!; canvas.width=canvas.height=CV;
  cbase(ctx); cheader(ctx,"Signal Activity",data.workspace.name);
  const tierCfg=[
    {tier:1,label:"High Intent",  color:CC.good,   desc:"Buying signals firing"},
    {tier:2,label:"Warm Signals", color:CC.warn,   desc:"Context events · personalize"},
    {tier:3,label:"Cold Targeted",color:CC.accent2,desc:"Precision, no signal"},
    {tier:4,label:"Experimental", color:CC.dim,    desc:"Test in small batches"},
  ];
  const total=data.signals.reduce((s,e)=>s+e.count,0)||1;
  const padX=48,gap=14,cols=2,tierW=(CV-padX*2-gap)/cols,tierH=186,startY=158;
  tierCfg.forEach((tc,ti)=>{
    const col=ti%cols,row=Math.floor(ti/cols),bx=padX+col*(tierW+gap),by=startY+row*(tierH+gap);
    crr(ctx,bx,by,tierW,tierH,14); ctx.fillStyle=CC.bg2; ctx.fill();
    crr(ctx,bx,by,4,tierH,2); ctx.fillStyle=tc.color; ctx.fill();
    ctx.fillStyle=tc.color+"44"; csf(ctx,48,900); ctx.fillText(`T${tc.tier}`,bx+16,by+52);
    ctx.fillStyle=tc.color; csf(ctx,19,700); ctx.fillText(tc.label,bx+16,by+78);
    ctx.fillStyle=CC.dim; csf(ctx,14,400); ctx.fillText(tc.desc,bx+16,by+98);
    const sigs=data.signals.filter(s=>s.tier===tc.tier).slice(0,3);
    if(sigs.length===0){ctx.fillStyle=CC.muted;csf(ctx,13,400);ctx.fillText("No events yet",bx+16,by+126);}
    else sigs.forEach((sig,si)=>{
      const ey=by+118+si*22,evLabel=sig.event.replace(/_/g," ");
      ctx.fillStyle=CC.sub; csf(ctx,13,400); ctx.fillText(evLabel.length>22?evLabel.slice(0,22)+"…":evLabel,bx+16,ey);
      const bw=Math.max(4,Math.round((sig.count/total)*(tierW-160)));
      crr(ctx,bx+tierW-90,ey-12,bw,8,4); ctx.fillStyle=tc.color+"55"; ctx.fill();
      ctx.fillStyle=tc.color; csf(ctx,13,700); ctx.textAlign="right"; ctx.fillText(sig.count.toLocaleString(),bx+tierW-14,ey); ctx.textAlign="left";
    });
  });
  const banY=startY+2*(tierH+gap)+10;
  crr(ctx,padX,banY,CV-padX*2,68,14);
  const bg=ctx.createLinearGradient(padX,banY,CV-padX,banY); bg.addColorStop(0,CC.accent+"22"); bg.addColorStop(1,CC.good+"22");
  ctx.fillStyle=bg; ctx.fill();
  ctx.fillStyle=CC.sub; csf(ctx,18,400); ctx.fillText("Total signal events",padX+20,banY+24);
  ctx.fillStyle=CC.text; csf(ctx,32,800); ctx.fillText(total.toLocaleString(),padX+20,banY+57);
  const t1=data.signals.filter(s=>s.tier===1).reduce((a,b)=>a+b.count,0);
  if(t1>0){ctx.fillStyle=CC.good;csf(ctx,26,800);ctx.textAlign="right";ctx.fillText(t1.toLocaleString()+" high intent",CV-padX-20,banY+57);ctx.textAlign="left";}
  cfooter(ctx,data.workspace.name);
}

const LI_CARDS = [
  { id:"metrics", title:"GTM Metrics",     draw: drawMetrics },
  { id:"funnel",  title:"Pipeline Funnel", draw: drawFunnel  },
  { id:"stack",   title:"The Stack",       draw: drawStack   },
  { id:"signals", title:"Signal Activity", draw: drawSignals },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT BUTTONS
// ─────────────────────────────────────────────────────────────────────────────

function ExportButton({ label, icon: Icon, color, loading, onClick }: {
  label: string; icon: typeof FileText; color: string; loading: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${color} ${loading ? "opacity-60 cursor-not-allowed" : ""}`}>
      {loading ? <RefreshCw size={13} className="animate-spin"/> : <Icon size={13}/>}
      {loading ? "Generating…" : label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const MANUAL_KEY = (id: string) => `gtm_manual_${id}`;

export default function GTMReportPage() {
  const [data, setData]               = useState<ReportData | null>(null);
  const [workspaceId, setWorkspaceId] = useState("");
  const [loading, setLoading]         = useState(true);
  const [period, setPeriod]           = useState<Period>("30d");
  const [showPeriod, setShowPeriod]   = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [manual, setManual]           = useState<ManualMetrics>({ domainReputation:"", positiveReplyRate:"", showUpRate:"", bounceRateOverride:"" });

  // Export states
  const [pdfLoading,  setPdfLoading]  = useState(false);
  const [xlsxLoading, setXlsxLoading] = useState(false);
  const [showLinkedIn, setShowLinkedIn] = useState(false);
  const [liCardIdx,   setLiCardIdx]   = useState(0);
  const [liSaved,     setLiSaved]     = useState<string|null>(null);
  const [liSharing,      setLiSharing]      = useState(false);
  const [toast,          setToast]          = useState<string|null>(null);
  const [shareModal,     setShareModal]     = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [captionCopied,  setCaptionCopied]  = useState(false);

  // LinkedIn canvas refs
  const previewRef = useRef<HTMLCanvasElement>(null);
  const offscreen  = useRef<HTMLCanvasElement[]>([]);

  const token = () => localStorage.getItem("iqpipe_token") ?? "";

  useEffect(() => { offscreen.current = LI_CARDS.map(() => document.createElement("canvas")); }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/workspaces/primary`, { headers:{ Authorization:`Bearer ${token()}` } })
      .then(r=>r.ok?r.json():null)
      .then(d=>{
        if(d?.id){
          setWorkspaceId(d.id);
          const saved=localStorage.getItem(MANUAL_KEY(d.id));
          if(saved) try{ setManual(JSON.parse(saved)); }catch{}
        }
      }).catch(()=>{});
  }, []);

  const load = useCallback(async (wsId: string, p: Period) => {
    if (!wsId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/gtm-report?workspaceId=${wsId}&period=${p}`, { headers:{ Authorization:`Bearer ${token()}` } });
      if (r.ok) { setData(await r.json()); setLastRefresh(new Date()); }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { if (workspaceId) load(workspaceId, period); }, [workspaceId, period, load]);

  // Render offscreen cards when data arrives
  useEffect(() => {
    if (!data) return;
    LI_CARDS.forEach((card, i) => { const c=offscreen.current[i]; if(c) card.draw(c,data); });
  }, [data]);

  // Redraw preview when card or data changes
  useEffect(() => {
    const c=previewRef.current;
    if(!c||!data) return;
    LI_CARDS[liCardIdx].draw(c, data);
    c.style.width="100%"; c.style.maxWidth="480px"; c.style.height="auto";
    c.style.display="block"; c.style.borderRadius="10px";
  }, [liCardIdx, data]);

  const saveManual = (patch: Partial<ManualMetrics>) => {
    const updated={...manual,...patch}; setManual(updated);
    if(workspaceId) localStorage.setItem(MANUAL_KEY(workspaceId), JSON.stringify(updated));
  };

  const downloadReport = async (fmt: "pdf"|"xlsx") => {
    const set = fmt==="pdf" ? setPdfLoading : setXlsxLoading;
    set(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/export?workspaceId=${workspaceId}&format=${fmt}&period=${period}`, { headers:{ Authorization:`Bearer ${token()}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const date = new Date().toISOString().split("T")[0];
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a"); a.href=url; a.download=`gtm_report_${date}.${fmt}`; a.click();
      URL.revokeObjectURL(url);
    } catch {} finally { set(false); }
  };

  const downloadCard = (idx: number) => {
    const c=offscreen.current[idx]; if(!c) return;
    setLiSaved(LI_CARDS[idx].id);
    c.toBlob(blob=>{
      if(!blob) return;
      const url=URL.createObjectURL(blob),a=document.createElement("a");
      a.href=url; a.download=`iqpipe_linkedin_${LI_CARDS[idx].id}_${new Date().toISOString().split("T")[0]}.png`; a.click();
      URL.revokeObjectURL(url);
      setTimeout(()=>setLiSaved(null),1500);
    },"image/png");
  };

  const downloadAllCards = async () => {
    for(let i=0;i<LI_CARDS.length;i++){ downloadCard(i); await new Promise(r=>setTimeout(r,350)); }
  };

  const buildCaption = () => {
    if (!data) return "";
    const p = data.pipeline;
    const m = data.metrics;
    const lines: string[] = [
      `🚀 GTM Performance Report — ${data.workspace.name} (${data.period})`,
      ``,
      `📊 Pipeline`,
      `→ ${p.sourced.toLocaleString()} leads sourced`,
      `→ ${p.contacted.toLocaleString()} contacted`,
      `→ ${p.meetings.toLocaleString()} meetings booked`,
      `→ ${p.dealsWon.toLocaleString()} deals won`,
      ``,
    ];
    if (m.openRate !== null)    lines.push(`📧 Open rate: ${m.openRate}%`);
    if (m.replyRate !== null)   lines.push(`💬 Reply rate: ${m.replyRate}%`);
    if (m.meetingRate !== null) lines.push(`🎯 Reply → meeting: ${m.meetingRate}%`);
    lines.push(``, `Tracked with iqpipe — GTM observability for revenue teams.`);
    lines.push(``, `#GTM #SalesEngineering #RevOps #B2BSales #OutboundSales`);
    return lines.join("\n");
  };

  const shareToLinkedIn = async () => {
    if (!data) return;
    setLiSharing(true);

    // Download all 4 images in background
    for (let i = 0; i < LI_CARDS.length; i++) {
      downloadCard(i);
      await new Promise(r => setTimeout(r, 400));
    }

    const caption = buildCaption();
    setGeneratedCaption(caption);
    setCaptionCopied(false);
    setShareModal(true);
    setLiSharing(false);
  };

  const copyCaption = async () => {
    try { await navigator.clipboard.writeText(generatedCaption); } catch {}
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2500);
  };

  const openLinkedIn = () => {
    window.open("https://www.linkedin.com/feed/?shareActive=true", "_blank");
    setShareModal(false);
    setToast("LinkedIn opened — click in the text box and press Ctrl+V to paste your caption, then drag the images in");
    setTimeout(() => setToast(null), 8000);
  };

  // Diagnostics
  const diagnostics: { severity:"error"|"warning"|"info"; msg:string }[] = [];
  if (data) {
    const {pipeline:p, metrics:m} = data;
    const effectiveBounce = m.bounceRate ?? (manual.bounceRateOverride ? parseFloat(manual.bounceRateOverride) : null);
    if (effectiveBounce!==null&&effectiveBounce>2) diagnostics.push({severity:"error",msg:`Bounce rate ${effectiveBounce}% exceeds 2% — domain reputation at risk. Warm up inboxes and validate lists before volume sends.`});
    if (p.sourced>0&&p.enriched/p.sourced<0.5) diagnostics.push({severity:"warning",msg:`Only ${Math.round((p.enriched/p.sourced)*100)}% of sourced leads were enriched. Layer tech stack, hiring, and funding signals to improve targeting.`});
    if (m.replyRate!==null&&m.replyRate<1) diagnostics.push({severity:"error",msg:`Reply rate ${m.replyRate}% is below 1%. Treating every prospect the same? High-intent and cold leads need different copy and urgency.`});
    if (m.openRate!==null&&m.openRate<20&&(m.replyRate??0)<2) diagnostics.push({severity:"warning",msg:`Open rate ${m.openRate}% is low — deliverability issue. Check DNS (SPF/DKIM/DMARC) and sending volume ramp.`});
    if (m.openRate!==null&&m.openRate>40&&(m.replyRate??0)<2) diagnostics.push({severity:"info",msg:"High opens, low replies — people read but don't respond. Optimize CTA and value prop, not subject lines."});
    if (p.meetings>0&&p.dealsWon===0) diagnostics.push({severity:"warning",msg:"Meetings booking but no deals closing. Check handoff SLA — warm replies die without clear SDR/AE handoff and response time target."});
    const su=manual.showUpRate?parseFloat(manual.showUpRate):null;
    if(su!==null&&su<70) diagnostics.push({severity:"warning",msg:`Show-up rate ${su}% below 70%. Add calendar confirmation sequences — show-ups are a function of urgency and reminder quality.`});
    if(diagnostics.length===0) diagnostics.push({severity:"info",msg:"No critical issues detected. Keep monitoring — most GTM problems are silent until they compound."});
  }

  const isEmpty = data && data.pipeline.sourced===0 && data.signals.length===0;

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-6 space-y-6 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <FileText size={18} className="text-indigo-400"/>
          <div>
            <h1 className="text-base font-bold text-white leading-none">GTM Report</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">Stack · pipeline · outreach benchmarks · signals · diagnostics</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period */}
          <div className="relative">
            <button onClick={()=>setShowPeriod(v=>!v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 transition-colors">
              <Calendar size={11} className="text-slate-600"/>
              {PERIOD_LABELS[period]}
              <ChevronDown size={11} className={`text-slate-600 transition-transform ${showPeriod?"rotate-180":""}`}/>
            </button>
            {showPeriod && (
              <div className="absolute top-full right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden z-20 shadow-xl w-40">
                {(Object.entries(PERIOD_LABELS) as [Period,string][]).map(([k,l])=>(
                  <button key={k} onClick={()=>{setPeriod(k);setShowPeriod(false);}}
                    className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-800 transition-colors ${period===k?"text-indigo-400 font-medium":"text-slate-400"}`}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-[10px] text-slate-700 tabular-nums">
            {lastRefresh.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
          </span>
          <button onClick={()=>{setLoading(true);load(workspaceId,period);}}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 transition-colors">
            <RefreshCw size={11} className={loading?"animate-spin":""}/>
          </button>

          {/* Export buttons */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <ExportButton label="PDF" icon={FileText} loading={pdfLoading}
              color="bg-indigo-600/80 hover:bg-indigo-500/80 border-indigo-500/60 text-white"
              onClick={()=>downloadReport("pdf")}/>
            <ExportButton label="XLSX" icon={Download} loading={xlsxLoading}
              color="bg-emerald-700/60 hover:bg-emerald-600/60 border-emerald-600/60 text-white"
              onClick={()=>downloadReport("xlsx")}/>
            <button
              onClick={()=>setShowLinkedIn(v=>!v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${showLinkedIn?"bg-sky-600 border-sky-500 text-white":"bg-slate-900 border-slate-700 hover:border-sky-600/50 text-slate-300 hover:text-sky-400"}`}>
              <Linkedin size={13}/>
              LinkedIn
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-600 text-sm gap-2">
          <RefreshCw size={14} className="animate-spin"/> Building report…
        </div>
      ) : isEmpty ? (
        <SeedBanner onSeeded={()=>load(workspaceId,period)}/>
      ) : data && (
        <>
          {/* ── LinkedIn panel ── */}
          {showLinkedIn && (
            <div className="bg-slate-900 border border-sky-500/20 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Linkedin size={14} className="text-sky-400"/>
                  <span className="text-sm font-semibold text-white">LinkedIn Cards</span>
                  <span className="text-[10px] text-slate-500">1080×1080 PNG · {LI_CARDS.length} cards ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
                    {LI_CARDS.map((card,i)=>(
                      <button key={card.id} onClick={()=>setLiCardIdx(i)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${liCardIdx===i?"bg-sky-600 text-white":"text-slate-500 hover:text-slate-300"}`}>
                        {card.title}
                      </button>
                    ))}
                  </div>
                  <button onClick={()=>setLiCardIdx(v=>(v-1+LI_CARDS.length)%LI_CARDS.length)} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400"><ChevronLeft size={12}/></button>
                  <button onClick={()=>setLiCardIdx(v=>(v+1)%LI_CARDS.length)} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400"><ChevronRight size={12}/></button>
                  <button onClick={()=>downloadCard(liCardIdx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${liSaved===LI_CARDS[liCardIdx].id?"bg-emerald-700/40 border-emerald-600/40 text-emerald-400":"bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-300"}`}>
                    <Image size={11}/>{liSaved===LI_CARDS[liCardIdx].id?"Saved!":"Save PNG"}
                  </button>
                  <button onClick={downloadAllCards}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs text-slate-300 transition-colors">
                    <Download size={11}/>All 4
                  </button>
                  <button onClick={shareToLinkedIn} disabled={liSharing}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg border text-xs font-semibold transition-all ${liSharing?"opacity-60 cursor-not-allowed bg-sky-700 border-sky-600 text-white":"bg-sky-600 hover:bg-sky-500 border-sky-500 text-white"}`}>
                    {liSharing ? <RefreshCw size={11} className="animate-spin"/> : <Linkedin size={11}/>}
                    {liSharing ? "Preparing…" : "Post to LinkedIn"}
                  </button>
                </div>
              </div>
              <div className="p-5 flex justify-center bg-[#070d1a]">
                <canvas ref={previewRef}/>
              </div>
            </div>
          )}

          {/* ── STACK ── */}
          <section>
            <h2 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">The Stack</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(CATEGORY_CFG).map(([cat,cfg])=>{
                const tools=data.stack[cat]??[];
                return (
                  <div key={cat} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <cfg.icon size={13} className={cfg.color.split(" ")[0]}/>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{cfg.label}</span>
                    </div>
                    {tools.length>0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {tools.map(t=>(
                          <span key={t.tool} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>{t.label}</span>
                        ))}
                      </div>
                    ) : <span className="text-[10px] text-slate-700 italic">Not connected</span>}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── PIPELINE ── */}
          <section>
            <h2 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Data Pipeline</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center flex-wrap gap-1 mb-4">
                {["Aggregate","Enrich","Activate"].map((s,i)=>(
                  <div key={s} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                      <span className={`text-xs font-bold ${["text-violet-400","text-blue-400","text-orange-400"][i]}`}>{i+1}</span>
                      <span className="text-xs font-semibold text-slate-300">{s}</span>
                    </div>
                    {i<2&&<ChevronRight size={12} className="text-slate-700"/>}
                  </div>
                ))}
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <PipelineStep label="Sourced"   count={data.pipeline.sourced}   total={data.pipeline.sourced}   color="text-violet-400"/>
                <PipelineStep label="Enriched"  count={data.pipeline.enriched}  total={data.pipeline.sourced}   color="text-blue-400"/>
                <PipelineStep label="Contacted" count={data.pipeline.contacted} total={data.pipeline.sourced}   color="text-orange-400"/>
                <PipelineStep label="Replied"   count={data.pipeline.replied}   total={data.pipeline.sourced}   color="text-amber-400"/>
                <PipelineStep label="Meetings"  count={data.pipeline.meetings}  total={data.pipeline.sourced}   color="text-emerald-400"/>
                <PipelineStep label="Won"       count={data.pipeline.dealsWon}  total={data.pipeline.sourced}   color="text-emerald-300" isLast/>
              </div>
            </div>
          </section>

          {/* ── METRICS ── */}
          <section>
            <h2 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Metrics that Matter</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800"><div className="w-2 h-2 rounded-full bg-rose-500"/><span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Production</span></div>
                <MetricCard label="Bounce Rate" value={data.metrics.bounceRate??(manual.bounceRateOverride?parseFloat(manual.bounceRateOverride):null)} unit="%" bKey="bounceRate" note="Source from your sending tool"/>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2.5 space-y-2">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1">Manual entry</p>
                  <EditableMetric label="Bounce Rate override" value={manual.bounceRateOverride} unit="%" onChange={v=>saveManual({bounceRateOverride:v})}/>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">Domain Reputation</span>
                    <div className="flex gap-1">
                      {(["high","medium","low"] as const).map(rep=>(
                        <button key={rep} onClick={()=>saveManual({domainReputation:manual.domainReputation===rep?"":rep})}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${manual.domainReputation===rep?rep==="high"?"bg-emerald-500/20 border-emerald-500/40 text-emerald-400":rep==="medium"?"bg-amber-500/20 border-amber-500/40 text-amber-400":"bg-rose-500/20 border-rose-500/40 text-rose-400":"bg-slate-800 border-slate-700 text-slate-600 hover:text-slate-400"}`}>
                          {rep}
                        </button>
                      ))}
                    </div>
                  </div>
                  <MetricCard label="Unsubscribe Rate" value={data.metrics.unsubRate} unit="%" bKey="unsubRate"/>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800"><div className="w-2 h-2 rounded-full bg-blue-500"/><span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Distribution</span></div>
                <MetricCard label="Open Rate"  value={data.metrics.openRate}  unit="%" bKey="openRate"  note={data.metrics.openRate===null?"No email_opened events yet":undefined}/>
                <MetricCard label="Reply Rate" value={data.metrics.replyRate} unit="%" bKey="replyRate" note={`From ${data.metrics.emailsSent.toLocaleString()} emails sent`}/>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2.5">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-2">Manual entry</p>
                  <EditableMetric label="Positive Reply Rate" value={manual.positiveReplyRate} unit="%" onChange={v=>saveManual({positiveReplyRate:v})}/>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800"><div className="w-2 h-2 rounded-full bg-emerald-500"/><span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversion</span></div>
                <MetricCard label="Reply → Meeting" value={data.metrics.meetingRate} unit="%" bKey="meetingRate"/>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2.5 space-y-2">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1">Manual entry</p>
                  <EditableMetric label="Show-up Rate" value={manual.showUpRate} unit="%" onChange={v=>saveManual({showUpRate:v})}/>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2.5">
                  <p className="text-[10px] text-slate-600 mb-1">Pipeline Created</p>
                  <p className="text-xl font-bold text-white tabular-nums">{data.metrics.totalPipelineValue>0?`$${data.metrics.totalPipelineValue.toLocaleString()}`:"—"}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{data.pipeline.dealsWon} deal{data.pipeline.dealsWon!==1?"s":""} won</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SIGNALS ── */}
          <section>
            <h2 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Signal Activity</h2>
            <div className="grid md:grid-cols-4 gap-3">
              {TIER_CFG.map(({tier,label,desc,color})=>{
                const sigs=data.signals.filter(s=>s.tier===tier);
                const tot=sigs.reduce((s,e)=>s+e.count,0);
                return (
                  <div key={tier} className={`rounded-xl border p-4 ${color}`}>
                    <div className="mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Tier {tier}</span>
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="text-[10px] opacity-60 leading-tight">{desc}</p>
                    </div>
                    {sigs.length>0?(
                      <div className="space-y-1.5 mt-3">
                        {sigs.slice(0,4).map(s=>(
                          <div key={s.event} className="flex items-center justify-between gap-2">
                            <code className="text-[10px] font-mono opacity-80 truncate">{s.event}</code>
                            <span className="text-xs font-bold tabular-nums shrink-0">{s.count.toLocaleString()}</span>
                          </div>
                        ))}
                        {sigs.length>4&&<p className="text-[10px] opacity-40">+{sigs.length-4} more</p>}
                        <div className="pt-1 border-t border-current/10 mt-2">
                          <span className="text-xs font-bold tabular-nums">{tot.toLocaleString()} total</span>
                        </div>
                      </div>
                    ):<p className="text-[10px] opacity-40 mt-3 italic">No events</p>}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── DIAGNOSTICS ── */}
          <section>
            <h2 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Diagnostics</h2>
            <div className="space-y-2">
              {diagnostics.map((d,i)=>(
                <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${d.severity==="error"?"bg-rose-500/6 border-rose-500/20":d.severity==="warning"?"bg-amber-500/6 border-amber-500/20":"bg-sky-500/6 border-sky-500/20"}`}>
                  {d.severity==="error"  &&<AlertTriangle size={14} className="text-rose-400 shrink-0 mt-0.5"/>}
                  {d.severity==="warning"&&<AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5"/>}
                  {d.severity==="info"   &&<CheckCircle2  size={14} className="text-sky-400 shrink-0 mt-0.5"/>}
                  <span className="text-slate-200">{d.msg}</span>
                </div>
              ))}
            </div>
          </section>

          <p className="text-[10px] text-slate-700 pb-4">
            Metrics auto-computed from Touchpoint events. Manual fields saved locally. Bounce rate & domain reputation must be sourced from your sending tool.
          </p>
        </>
      )}

      {/* LinkedIn share modal */}
      {shareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Linkedin size={16} className="text-sky-400"/>
                <span className="text-sm font-semibold text-white">Ready to post on LinkedIn</span>
              </div>
              <button onClick={()=>setShareModal(false)} className="text-slate-500 hover:text-white"><X size={15}/></button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Steps */}
              <div className="flex gap-4 text-xs">
                {[
                  { n:"1", text:"4 images saved to Downloads", done:true },
                  { n:"2", text:"Copy caption below", done:captionCopied },
                  { n:"3", text:"Paste into LinkedIn", done:false },
                ].map(s=>(
                  <div key={s.n} className={`flex-1 flex items-start gap-2 px-3 py-2 rounded-xl border ${s.done?"bg-emerald-500/10 border-emerald-500/20 text-emerald-400":"bg-slate-800/60 border-slate-700 text-slate-400"}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${s.done?"bg-emerald-500 text-white":"bg-slate-700 text-slate-400"}`}>{s.done?"✓":s.n}</span>
                    <span className="leading-tight">{s.text}</span>
                  </div>
                ))}
              </div>

              {/* Caption textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Post caption</span>
                  <button onClick={copyCaption}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium transition-all ${captionCopied?"bg-emerald-600/30 border-emerald-600/40 text-emerald-400":"bg-indigo-600/80 hover:bg-indigo-500/80 border-indigo-500/60 text-white"}`}>
                    {captionCopied ? <><Check size={11}/>Copied!</> : <><Download size={11}/>Copy Caption</>}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={generatedCaption}
                  rows={10}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-mono resize-none outline-none focus:border-slate-600 leading-relaxed"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <p className="text-[11px] text-slate-600 leading-tight flex-1">
                In LinkedIn: click the text box → Ctrl+V to paste caption, then drag your 4 images into the post.
              </p>
              <button onClick={openLinkedIn}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 border border-sky-500 text-white text-sm font-semibold transition-colors shrink-0">
                <Linkedin size={14}/>
                Open LinkedIn →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-800 border border-sky-500/40 shadow-2xl shadow-black/60 text-sm text-white max-w-lg text-center animate-fade-in">
          <Linkedin size={15} className="text-sky-400 shrink-0"/>
          <span>{toast}</span>
          <button onClick={()=>setToast(null)} className="text-slate-500 hover:text-slate-300 ml-1 shrink-0"><X size={13}/></button>
        </div>
      )}
    </div>
  );
}
