import { useState, useEffect, useRef, useCallback } from "react";
import { Linkedin, Download, RefreshCw, Image, ChevronLeft, ChevronRight } from "lucide-react";
import { API_BASE_URL } from "../../config";
import SeedBanner from "../components/SeedBanner";

// ── Canvas constants ───────────────────────────────────────────────────────────
const S = 1080;

const C = {
  bg:      "#0f172a",
  bg2:     "#1e293b",
  muted:   "#334155",
  text:    "#f8fafc",
  sub:     "#94a3b8",
  dim:     "#64748b",
  accent:  "#6366f1",
  accent2: "#818cf8",
  good:    "#10b981",
  warn:    "#f59e0b",
  bad:     "#f43f5e",
  purple:  "#a855f7",
  sky:     "#38bdf8",
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface ReportData {
  workspace: { name: string };
  period: string;
  stack: Record<string, { tool: string; label: string }[]>;
  pipeline: { sourced: number; enriched: number; contacted: number; replied: number; meetings: number; dealsWon: number };
  metrics: { openRate: number|null; replyRate: number|null; unsubRate: number|null; bounceRate: number|null; meetingRate: number|null; emailsSent: number; totalPipelineValue: number };
  signals: { event: string; count: number; tier: number }[];
}

// ── Drawing utilities ──────────────────────────────────────────────────────────
function sf(ctx: CanvasRenderingContext2D, size: number, weight: number | string = 400) {
  ctx.font = `${weight} ${size}px "Inter","Segoe UI","SF Pro Display",system-ui,sans-serif`;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function noise(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalAlpha = 0.025;
  ctx.fillStyle = "#ffffff";
  for (let gx = 0; gx < S; gx += 40) {
    for (let gy = 0; gy < S; gy += 40) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function stripe(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, S, 0);
  g.addColorStop(0,   C.accent);
  g.addColorStop(0.5, C.purple);
  g.addColorStop(1,   C.sky);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, 6);
}

function brand(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rr(ctx, x, y - 22, 26, 26, 6);
  ctx.fillStyle = C.accent;
  ctx.fill();
  ctx.fillStyle = "#fff";
  sf(ctx, 13, 800);
  ctx.textAlign = "left";
  ctx.fillText("iq", x + 4, y - 2);
  ctx.fillStyle = C.text;
  sf(ctx, 20, 700);
  ctx.fillText("iqpipe", x + 34, y - 2);
}

function footer(ctx: CanvasRenderingContext2D, workspace: string) {
  ctx.fillStyle = C.muted;
  ctx.fillRect(0, S - 72, S, 72);
  ctx.fillStyle = C.bg2;
  ctx.fillRect(0, S - 73, S, 1);
  brand(ctx, 48, S - 26);
  const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  ctx.fillStyle = C.dim;
  sf(ctx, 17, 400);
  ctx.textAlign = "center";
  ctx.fillText(`${workspace} · ${date}`, S / 2, S - 26);
  ctx.textAlign = "right";
  ctx.fillText("iqpipe.com", S - 48, S - 26);
  ctx.textAlign = "left";
}

function header(ctx: CanvasRenderingContext2D, title: string, workspace: string) {
  ctx.fillStyle = C.bg2;
  ctx.fillRect(0, 6, S, 138);
  brand(ctx, 48, 50);
  ctx.fillStyle = C.dim;
  sf(ctx, 17, 400);
  ctx.textAlign = "right";
  ctx.fillText(workspace, S - 48, 50);
  ctx.textAlign = "left";
  ctx.fillStyle = C.text;
  sf(ctx, 50, 800);
  ctx.fillText(title, 48, 118);
}

function base(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, S, S);
  noise(ctx);
  stripe(ctx);
}

// ── CARD 1: Metrics ───────────────────────────────────────────────────────────
function drawMetrics(canvas: HTMLCanvasElement, data: ReportData) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = canvas.height = S;
  base(ctx);

  ctx.fillStyle = C.bg2;
  ctx.fillRect(0, 6, S, 190);
  brand(ctx, 48, 58);

  // Period badge
  sf(ctx, 17, 500);
  const pw = ctx.measureText(data.period).width + 28;
  rr(ctx, S - 48 - pw, 38, pw, 28, 14);
  ctx.fillStyle = C.accent + "33";
  ctx.fill();
  ctx.fillStyle = C.accent2;
  ctx.textAlign = "right";
  ctx.fillText(data.period, S - 48 - 14, 57);
  ctx.textAlign = "left";

  ctx.fillStyle = C.text;
  sf(ctx, 52, 800);
  ctx.fillText("GTM Performance", 48, 135);
  ctx.fillStyle = C.sub;
  sf(ctx, 24, 400);
  ctx.fillText(data.workspace.name, 48, 173);

  const p = data.pipeline;
  const overallConv = p.sourced > 0
    ? ((p.dealsWon / p.sourced) * 100).toFixed(2) + "%"
    : "—";
  const pipeVal = data.metrics.totalPipelineValue > 0
    ? "$" + (data.metrics.totalPipelineValue >= 1000
        ? Math.round(data.metrics.totalPipelineValue / 1000) + "K"
        : data.metrics.totalPipelineValue)
    : "—";

  const tiles = [
    { label: "Leads Sourced", value: p.sourced.toLocaleString(),   color: C.accent2, sub: "imported & enriched" },
    { label: "Reply Rate",    value: data.metrics.replyRate != null ? data.metrics.replyRate + "%" : "—", color: data.metrics.replyRate != null && data.metrics.replyRate >= 3 ? C.good : C.warn, sub: "target: 3-8%" },
    { label: "Meetings",      value: p.meetings.toLocaleString(),   color: C.good,    sub: "booked from outreach" },
    { label: "Open Rate",     value: data.metrics.openRate  != null ? data.metrics.openRate  + "%" : "—", color: data.metrics.openRate  != null && data.metrics.openRate  >= 40 ? C.good : C.warn, sub: "target: 40-60%" },
    { label: "Source → Won",  value: overallConv,                    color: C.accent2, sub: p.dealsWon + " deals closed" },
    { label: "Pipeline",      value: pipeVal,                        color: C.good,    sub: "total value" },
  ];

  const cols = 3, padX = 40, gapX = 14, gapY = 12;
  const boxW = (S - padX * 2 - gapX * (cols - 1)) / cols;
  const boxH = 190;
  const startY = 210;

  tiles.forEach((tile, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const bx = padX + col * (boxW + gapX);
    const by = startY + row * (boxH + gapY);

    rr(ctx, bx, by, boxW, boxH, 14);
    ctx.fillStyle = C.bg2;
    ctx.fill();

    // top color bar
    rr(ctx, bx, by, boxW, 4, 2);
    ctx.fillStyle = tile.color;
    ctx.fill();

    ctx.fillStyle = tile.color;
    sf(ctx, 62, 800);
    ctx.fillText(tile.value, bx + 20, by + 82);

    ctx.fillStyle = C.text;
    sf(ctx, 19, 600);
    ctx.fillText(tile.label, bx + 20, by + 116);

    ctx.fillStyle = C.dim;
    sf(ctx, 15, 400);
    ctx.fillText(tile.sub, bx + 20, by + 140);
  });

  footer(ctx, data.workspace.name);
}

// ── CARD 2: Funnel ────────────────────────────────────────────────────────────
function drawFunnel(canvas: HTMLCanvasElement, data: ReportData) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = canvas.height = S;
  base(ctx);
  header(ctx, "Pipeline Funnel", data.workspace.name);

  const p = data.pipeline;
  const stages = [
    { label: "Sourced",   count: p.sourced,   base: p.sourced,    color: C.accent },
    { label: "Enriched",  count: p.enriched,  base: p.sourced,    color: C.accent2 },
    { label: "Contacted", count: p.contacted, base: p.sourced,    color: C.sky },
    { label: "Replied",   count: p.replied,   base: p.contacted,  color: C.warn },
    { label: "Meeting",   count: p.meetings,  base: p.replied,    color: C.good },
    { label: "Won",       count: p.dealsWon,  base: p.meetings,   color: "#fbbf24" },
  ];

  const maxCount = p.sourced || 1;
  const barMaxW = 550;
  const barH = 54;
  const barGap = 12;
  const labelX = 48;
  const barX = 310;
  const startY = 165;

  stages.forEach((s, i) => {
    const y = startY + i * (barH + barGap);
    const bw = Math.max(8, Math.round((s.count / maxCount) * barMaxW));

    // label
    ctx.fillStyle = C.sub;
    sf(ctx, 20, 500);
    ctx.textAlign = "right";
    ctx.fillText(s.label, barX - 18, y + 35);
    ctx.textAlign = "left";

    // track
    rr(ctx, barX, y, barMaxW, barH, 8);
    ctx.fillStyle = C.muted + "55";
    ctx.fill();

    // fill
    rr(ctx, barX, y, bw, barH, 8);
    const g = ctx.createLinearGradient(barX, 0, barX + bw, 0);
    g.addColorStop(0, s.color);
    g.addColorStop(1, s.color + "88");
    ctx.fillStyle = g;
    ctx.fill();

    // count
    ctx.fillStyle = C.text;
    sf(ctx, 20, 700);
    ctx.fillText(s.count.toLocaleString(), barX + barMaxW + 16, y + 35);

    // conv badge (skip first)
    if (i > 0 && s.base > 0) {
      const pct = Math.round((s.count / s.base) * 100);
      const col = pct >= 50 ? C.good : pct >= 20 ? C.warn : C.bad;
      rr(ctx, barX + barMaxW + 110, y + 12, 70, 30, 8);
      ctx.fillStyle = col + "33";
      ctx.fill();
      ctx.fillStyle = col;
      sf(ctx, 17, 700);
      ctx.textAlign = "center";
      ctx.fillText(pct + "%", barX + barMaxW + 145, y + 32);
      ctx.textAlign = "left";
    }
  });

  // Overall conversion callout
  const conv = p.sourced > 0 ? ((p.dealsWon / p.sourced) * 100).toFixed(2) : "0.00";
  const callY = startY + stages.length * (barH + barGap) + 16;

  rr(ctx, labelX, callY, S - labelX * 2, 74, 14);
  const cg = ctx.createLinearGradient(labelX, callY, S - labelX, callY);
  cg.addColorStop(0, C.accent + "22");
  cg.addColorStop(1, "#fbbf24" + "22");
  ctx.fillStyle = cg;
  ctx.fill();

  ctx.fillStyle = C.sub;
  sf(ctx, 19, 400);
  ctx.fillText("Overall Source → Won", labelX + 22, callY + 26);
  ctx.fillStyle = C.text;
  sf(ctx, 32, 800);
  ctx.fillText(conv + "%", labelX + 22, callY + 60);

  ctx.fillStyle = "#fbbf24";
  sf(ctx, 28, 800);
  ctx.textAlign = "right";
  ctx.fillText(p.dealsWon + " deals won", S - labelX - 22, callY + 60);
  ctx.textAlign = "left";

  footer(ctx, data.workspace.name);
}

// ── CARD 3: Stack ─────────────────────────────────────────────────────────────
function drawStack(canvas: HTMLCanvasElement, data: ReportData) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = canvas.height = S;
  base(ctx);
  header(ctx, "GTM Stack", data.workspace.name);

  const cats = [
    { key: "aggregation",    label: "Aggregation",    color: C.purple, icon: "◆" },
    { key: "enrichment",     label: "Enrichment",     color: C.sky,    icon: "◈" },
    { key: "activation",     label: "Activation",     color: C.warn,   icon: "▶" },
    { key: "crm",            label: "CRM",            color: C.good,   icon: "◉" },
    { key: "billing",        label: "Billing",        color: "#fbbf24", icon: "◎" },
    { key: "infrastructure", label: "Infrastructure", color: C.sub,    icon: "◐" },
  ].filter((c) => (data.stack[c.key] ?? []).length > 0);

  const padX = 48;
  // Content area: from 162 to S-80 (footer)
  const contentH = S - 80 - 162;
  const catH = cats.length > 0 ? Math.min(130, Math.floor(contentH / cats.length) - 8) : 130;

  let curY = 162;

  if (cats.length === 0) {
    ctx.fillStyle = C.dim;
    sf(ctx, 26, 400);
    ctx.textAlign = "center";
    ctx.fillText("No tools connected yet", S / 2, 420);
    ctx.textAlign = "left";
  } else {
    for (const cat of cats) {
      const tools = data.stack[cat.key] ?? [];
      if (curY + catH > S - 90) break; // guard against overflow

      // Row bg
      rr(ctx, padX, curY, S - padX * 2, catH, 12);
      ctx.fillStyle = cat.color + "18";
      ctx.fill();

      // Category label
      ctx.fillStyle = cat.color;
      sf(ctx, 13, 700);
      ctx.fillText(`${cat.icon} ${cat.label.toUpperCase()}`, padX + 16, curY + 22);

      // Tool pills on same row
      let pillX = padX + 180;
      const pillH = 28;
      const pillPad = 14;
      const pillGap = 8;
      const pillY = curY + (catH - pillH) / 2;

      for (const tool of tools) {
        sf(ctx, 15, 600);
        const tw = ctx.measureText(tool.label).width + pillPad * 2;
        if (pillX + tw > S - padX - 8) break; // don't overflow

        rr(ctx, pillX, pillY, tw, pillH, pillH / 2);
        ctx.fillStyle = C.bg2;
        ctx.fill();
        rr(ctx, pillX, pillY, tw, pillH, pillH / 2);
        ctx.strokeStyle = cat.color + "55";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = C.text;
        ctx.fillText(tool.label, pillX + pillPad, pillY + 19);
        pillX += tw + pillGap;
      }

      // Overflow count
      const shownCount = Math.floor((S - padX - 8 - (padX + 180)) / 80); // rough estimate
      if (tools.length > shownCount) {
        ctx.fillStyle = cat.color + "99";
        sf(ctx, 13, 500);
        ctx.fillText(`+${tools.length - shownCount}`, pillX + 4, pillY + 19);
      }

      curY += catH + 8;
    }
  }

  // Total tools
  const total = cats.reduce((s, c) => s + (data.stack[c.key]?.length ?? 0), 0);
  if (total > 0 && curY < S - 140) {
    const banY = S - 142;
    rr(ctx, padX, banY, S - padX * 2, 50, 10);
    ctx.fillStyle = C.muted + "88";
    ctx.fill();
    ctx.fillStyle = C.sub;
    sf(ctx, 18, 400);
    ctx.fillText(`${total} tool${total !== 1 ? "s" : ""} connected across your GTM stack`, padX + 18, banY + 31);
  }

  footer(ctx, data.workspace.name);
}

// ── CARD 4: Signals ───────────────────────────────────────────────────────────
function drawSignals(canvas: HTMLCanvasElement, data: ReportData) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = canvas.height = S;
  base(ctx);
  header(ctx, "Signal Activity", data.workspace.name);

  const tierCfg = [
    { tier: 1, label: "High Intent",   color: C.good,   desc: "Buying signals firing" },
    { tier: 2, label: "Warm Signals",  color: C.warn,   desc: "Context events · personalize" },
    { tier: 3, label: "Cold Targeted", color: C.accent2, desc: "Precision, no signal" },
    { tier: 4, label: "Experimental",  color: C.dim,    desc: "Test in small batches" },
  ];

  const total = data.signals.reduce((s, e) => s + e.count, 0) || 1;
  const padX = 48;
  const gap = 14;
  const cols = 2;
  const tierW = (S - padX * 2 - gap) / cols;
  const tierH = 186;
  const startY = 158;

  tierCfg.forEach((tc, ti) => {
    const col = ti % cols;
    const row = Math.floor(ti / cols);
    const bx = padX + col * (tierW + gap);
    const by = startY + row * (tierH + gap);

    rr(ctx, bx, by, tierW, tierH, 14);
    ctx.fillStyle = C.bg2;
    ctx.fill();

    // Left accent bar
    rr(ctx, bx, by, 4, tierH, 2);
    ctx.fillStyle = tc.color;
    ctx.fill();

    // Tier number (watermark)
    ctx.fillStyle = tc.color + "44";
    sf(ctx, 48, 900);
    ctx.fillText(`T${tc.tier}`, bx + 16, by + 52);

    ctx.fillStyle = tc.color;
    sf(ctx, 19, 700);
    ctx.fillText(tc.label, bx + 16, by + 78);

    ctx.fillStyle = C.dim;
    sf(ctx, 14, 400);
    ctx.fillText(tc.desc, bx + 16, by + 98);

    const tierSigs = data.signals.filter((s) => s.tier === tc.tier).slice(0, 3);

    if (tierSigs.length === 0) {
      ctx.fillStyle = C.muted;
      sf(ctx, 13, 400);
      ctx.fillText("No events yet", bx + 16, by + 126);
    } else {
      tierSigs.forEach((sig, si) => {
        const ey = by + 118 + si * 22;
        const evLabel = sig.event.replace(/_/g, " ");
        ctx.fillStyle = C.sub;
        sf(ctx, 13, 400);
        const maxChars = 22;
        ctx.fillText(evLabel.length > maxChars ? evLabel.slice(0, maxChars) + "…" : evLabel, bx + 16, ey);

        // mini bar
        const bw = Math.max(4, Math.round((sig.count / total) * (tierW - 160)));
        rr(ctx, bx + tierW - 90, ey - 12, bw, 8, 4);
        ctx.fillStyle = tc.color + "55";
        ctx.fill();

        ctx.fillStyle = tc.color;
        sf(ctx, 13, 700);
        ctx.textAlign = "right";
        ctx.fillText(sig.count.toLocaleString(), bx + tierW - 14, ey);
        ctx.textAlign = "left";
      });
    }
  });

  // Banner
  const banY = startY + 2 * (tierH + gap) + 10;
  rr(ctx, padX, banY, S - padX * 2, 68, 14);
  const bg = ctx.createLinearGradient(padX, banY, S - padX, banY);
  bg.addColorStop(0, C.accent + "22");
  bg.addColorStop(1, C.good + "22");
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.fillStyle = C.sub;
  sf(ctx, 18, 400);
  ctx.fillText("Total signal events", padX + 20, banY + 24);
  ctx.fillStyle = C.text;
  sf(ctx, 32, 800);
  ctx.fillText(total.toLocaleString(), padX + 20, banY + 57);

  const t1 = data.signals.filter((s) => s.tier === 1).reduce((a, b) => a + b.count, 0);
  if (t1 > 0) {
    ctx.fillStyle = C.good;
    sf(ctx, 26, 800);
    ctx.textAlign = "right";
    ctx.fillText(t1.toLocaleString() + " high intent", S - padX - 20, banY + 57);
    ctx.textAlign = "left";
  }

  footer(ctx, data.workspace.name);
}

// ── Card registry ─────────────────────────────────────────────────────────────
const CARDS = [
  { id: "metrics", title: "GTM Metrics",    subtitle: "Key performance numbers",    draw: drawMetrics },
  { id: "funnel",  title: "Pipeline Funnel", subtitle: "Stage-by-stage conversion",  draw: drawFunnel  },
  { id: "stack",   title: "The Stack",       subtitle: "Connected tools by category", draw: drawStack   },
  { id: "signals", title: "Signal Activity", subtitle: "Events by signal tier",      draw: drawSignals },
];

// ── Page ───────────────────────────────────────────────────────────────────────
export default function LinkedInCardsPage() {
  const [data, setData]               = useState<ReportData | null>(null);
  const [workspaceId, setWorkspaceId] = useState("");
  const [loading, setLoading]         = useState(true);
  const [activeIdx, setActiveIdx]     = useState(0);
  const [saved, setSaved]             = useState<string | null>(null);

  // One visible preview canvas
  const previewRef = useRef<HTMLCanvasElement>(null);
  // Offscreen canvases for full-res download (created imperatively, never in DOM)
  const offscreen  = useRef<HTMLCanvasElement[]>([]);

  const token = localStorage.getItem("iqpipe_token") ?? "";

  // Create offscreen canvases once
  useEffect(() => {
    offscreen.current = CARDS.map(() => document.createElement("canvas"));
  }, []);

  const loadData = useCallback(async (wsId: string) => {
    if (!wsId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/gtm-report?workspaceId=${wsId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setData(await r.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/workspaces/primary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.id) { setWorkspaceId(d.id); loadData(d.id); } })
      .catch(() => {});
  }, [loadData]);

  // Render ALL offscreen canvases when data arrives
  useEffect(() => {
    if (!data) return;
    CARDS.forEach((card, i) => {
      const c = offscreen.current[i];
      if (c) card.draw(c, data);
    });
  }, [data]);

  // Redraw preview when activeIdx or data changes
  useEffect(() => {
    const c = previewRef.current;
    if (!c || !data) return;
    CARDS[activeIdx].draw(c, data);
    c.style.width      = "100%";
    c.style.maxWidth   = "520px";
    c.style.height     = "auto";
    c.style.display    = "block";
    c.style.borderRadius = "12px";
  }, [activeIdx, data]);

  const downloadCard = useCallback((idx: number) => {
    const c = offscreen.current[idx];
    if (!c) return;
    setSaved(CARDS[idx].id);
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href     = url;
      a.download = `iqpipe_linkedin_${CARDS[idx].id}_${new Date().toISOString().split("T")[0]}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setTimeout(() => setSaved(null), 1500);
    }, "image/png");
  }, []);

  const downloadAll = useCallback(async () => {
    for (let i = 0; i < CARDS.length; i++) {
      downloadCard(i);
      await new Promise((res) => setTimeout(res, 350));
    }
  }, [downloadCard]);

  const isEmpty = data && data.pipeline.sourced === 0 && data.signals.length === 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-6 space-y-5 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Linkedin size={18} className="text-sky-400" />
          <div>
            <h1 className="text-base font-bold text-white leading-none">LinkedIn Cards</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              1080×1080 PNG — drawn from live data, ready to post as a carousel
            </p>
          </div>
        </div>
        {data && !isEmpty && (
          <button
            onClick={downloadAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 border border-sky-500 text-white text-xs font-medium transition-colors"
          >
            <Download size={13} /> Download All 4
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-600 text-sm gap-2">
          <RefreshCw size={14} className="animate-spin" /> Loading…
        </div>
      ) : isEmpty ? (
        <SeedBanner onSeeded={() => loadData(workspaceId)} />
      ) : (
        <>
          {/* Card tabs */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {CARDS.map((card, i) => (
              <button
                key={card.id}
                onClick={() => setActiveIdx(i)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeIdx === i
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Image size={11} />
                {card.title}
              </button>
            ))}
          </div>

          {/* Preview panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{CARDS[activeIdx].title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{CARDS[activeIdx].subtitle} · 1080×1080 PNG</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveIdx((v) => (v - 1 + CARDS.length) % CARDS.length)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px] text-slate-600 w-12 text-center tabular-nums">
                  {activeIdx + 1} / {CARDS.length}
                </span>
                <button
                  onClick={() => setActiveIdx((v) => (v + 1) % CARDS.length)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => downloadCard(activeIdx)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    saved === CARDS[activeIdx].id
                      ? "bg-emerald-700/40 border-emerald-600/40 text-emerald-400"
                      : "bg-sky-600 hover:bg-sky-500 border-sky-500 text-white"
                  }`}
                >
                  <Download size={12} />
                  {saved === CARDS[activeIdx].id ? "Saved!" : "Download PNG"}
                </button>
              </div>
            </div>

            <div className="p-6 flex justify-center bg-[#070d1a]">
              {/* Single canvas — redrawn on tab change via useEffect */}
              <canvas ref={previewRef} />
            </div>
          </div>

          {/* Quick download grid */}
          <div className="grid grid-cols-2 gap-3">
            {CARDS.map((card, i) => (
              <button
                key={card.id}
                onClick={() => downloadCard(i)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <Image size={14} className="text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">Card {i + 1} — {card.title}</p>
                  <p className="text-[10px] text-slate-500">{card.subtitle}</p>
                </div>
                <Download size={12} className={saved === card.id ? "text-emerald-400" : "text-slate-600"} />
              </button>
            ))}
          </div>

          {/* Tips */}
          <div className="bg-sky-500/5 border border-sky-500/15 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-sky-400 uppercase tracking-widest mb-2">LinkedIn Carousel Tips</p>
            <ul className="space-y-1">
              {[
                "Upload all 4 PNGs as one post — LinkedIn turns them into a swipeable carousel",
                "Card 1 (Metrics) is your cover — it's what people see before swiping",
                "Caption hook: 'Here's our GTM stack performance this month 👇'",
                "Best time to post: Tuesday–Thursday, 8–10am local time",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-[11px] text-slate-400">
                  <span className="text-sky-500 shrink-0">→</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
