import { useState, useEffect } from "react";
import {
  FileText, Download, Table2, CheckCircle2,
  RefreshCw, Calendar, ChevronDown,
} from "lucide-react";
import { API_BASE_URL } from "../../config";

// ── Types ──────────────────────────────────────────────────────────────────────

type Format  = "pdf" | "xlsx";
type Period  = "7d" | "30d" | "90d" | "all";
type Status  = "idle" | "loading" | "done" | "error";

const PERIOD_LABELS: Record<Period, string> = {
  "7d":  "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "all": "All time",
};

// ── Format pill ────────────────────────────────────────────────────────────────

function FormatPill({ fmt, selected, onClick }: { fmt: Format; selected: boolean; onClick: () => void }) {
  const cfg: Record<Format, { icon: typeof FileText; label: string; desc: string }> = {
    pdf:  { icon: FileText, label: "PDF",  desc: "Professional document with cover page, tables & sections" },
    xlsx: { icon: Table2,   label: "XLSX", desc: "Multi-sheet workbook with formatted data, ready for analysis" },
  };
  const c = cfg[fmt];
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
        selected
          ? "bg-indigo-500/10 border-indigo-500/30"
          : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
      }`}
    >
      <div className={`mt-0.5 p-1.5 rounded-lg ${selected ? "bg-indigo-500/20" : "bg-slate-800"}`}>
        <c.icon size={14} className={selected ? "text-indigo-400" : "text-slate-500"} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${selected ? "text-white" : "text-slate-400"}`}>{c.label}</span>
          {selected && <CheckCircle2 size={12} className="text-indigo-400" />}
        </div>
        <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">{c.desc}</p>
      </div>
    </button>
  );
}

// ── Download button ────────────────────────────────────────────────────────────

function DownloadButton({ format, period, workspaceId }: { format: Format; period: Period; workspaceId: string }) {
  const [status, setStatus]   = useState<Status>("idle");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const token = localStorage.getItem("iqpipe_token") ?? "";

  const download = async () => {
    if (!workspaceId || status === "loading") return;
    setStatus("loading");
    setFileSize(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/reports/export?workspaceId=${workspaceId}&format=${format}&period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      setFileSize(blob.size);
      const ext      = format === "pdf" ? "pdf" : "xlsx";
      const date     = new Date().toISOString().split("T")[0];
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href     = objectUrl;
      a.download = `gtm_report_${date}.${ext}`;
      a.click();
      URL.revokeObjectURL(objectUrl);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const labels: Record<Status, string> = {
    idle:    format === "pdf" ? "Download PDF" : "Download XLSX",
    loading: "Generating…",
    done:    `Downloaded${fileSize ? ` · ${Math.round(fileSize / 1024)} KB` : ""}`,
    error:   "Failed — try again",
  };
  const colors: Record<Status, string> = {
    idle:    format === "pdf"
      ? "bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white"
      : "bg-emerald-700/80 hover:bg-emerald-600/80 border-emerald-600 text-white",
    loading: "bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed",
    done:    "bg-emerald-700/40 border-emerald-600/40 text-emerald-400",
    error:   "bg-rose-700/40 border-rose-600/40 text-rose-400",
  };
  const Icon = format === "pdf" ? FileText : Table2;

  return (
    <button
      onClick={download}
      disabled={status === "loading"}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium text-sm transition-all ${colors[status]}`}
    >
      {status === "loading" ? <RefreshCw size={14} className="animate-spin" />
        : status === "done" ? <CheckCircle2 size={14} />
        : <Icon size={14} />}
      {labels[status]}
      {status === "idle" && <Download size={12} className="opacity-60" />}
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const SECTIONS = ["Executive Summary", "The Stack", "Pipeline Funnel", "Outreach Performance", "Per-Tool Health", "Signal Activity"];

const PDF_FEATURES = [
  "Cover page with workspace name, period, and generation date",
  "5-page structured document with section headings and page numbers",
  "Color-coded benchmark tables (green / amber / red)",
  "Pipeline funnel with drop-off analysis",
  "Selectable text — not a screenshot or image export",
];
const XLSX_FEATURES = [
  "6 worksheets: Overview, Pipeline, Metrics, Stack, Signals, Tool Health",
  "Color-coded status cells with benchmark thresholds applied",
  "Number formatting, column widths, and freeze panes set",
  "Raw numeric data — ready for pivot tables or charting",
  "Compatible with Excel, Google Sheets, and Numbers",
];

const COMPARISON = [
  ["Shareable with stakeholders",          true,  true  ],
  ["Visual layout with cover page",        true,  false ],
  ["Selectable / searchable text",         true,  true  ],
  ["Editable / filterable data",           false, true  ],
  ["Pivot table support",                  false, true  ],
  ["Page numbers and section headings",    true,  false ],
  ["Color-coded benchmark indicators",     true,  true  ],
  ["Raw numeric data for further calc.",   false, true  ],
  ["Multiple data sheets",                 false, true  ],
] as const;

export default function ReportingPage() {
  const [workspaceId, setWorkspaceId] = useState("");
  const [period, setPeriod]           = useState<Period>("30d");
  const [format, setFormat]           = useState<Format>("pdf");
  const [showPeriod, setShowPeriod]   = useState(false);
  const token = localStorage.getItem("iqpipe_token") ?? "";

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/workspaces/primary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.id) setWorkspaceId(d.id); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-6 space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText size={18} className="text-indigo-400" />
        <div>
          <h1 className="text-base font-bold text-white leading-none">Reports</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Generate professional documents from your live GTM data — real files, not screenshots
          </p>
        </div>
      </div>

      {/* Report card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

        {/* Report header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
              <FileText size={20} className="text-indigo-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white">GTM Health Report</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-indigo-500/20 border-indigo-500/30 text-indigo-400 font-semibold">Recommended</span>
              </div>
              <p className="text-[12px] text-slate-500 mt-1.5 leading-relaxed">
                Full-stack GTM diagnostic covering pipeline conversion, outreach benchmarks, per-tool health,
                and signal activity. Best used for weekly reviews, investor updates, and team retrospectives.
              </p>
            </div>
          </div>
        </div>

        {/* Sections included */}
        <div className="px-6 py-4 border-b border-slate-800">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-2.5">Sections Included</p>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <span key={s} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                <CheckCircle2 size={10} className="text-emerald-500" />
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Configuration */}
        <div className="px-6 py-5 space-y-5">

          {/* Period */}
          <div>
            <label className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold block mb-2">Date Range</label>
            <div className="relative inline-block">
              <button
                onClick={() => setShowPeriod((v) => !v)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-sm text-slate-300 transition-colors"
              >
                <Calendar size={13} className="text-slate-500" />
                {PERIOD_LABELS[period]}
                <ChevronDown size={12} className={`text-slate-600 transition-transform ${showPeriod ? "rotate-180" : ""}`} />
              </button>
              {showPeriod && (
                <div className="absolute top-full left-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden z-20 shadow-xl w-44">
                  {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setPeriod(key); setShowPeriod(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-800 transition-colors ${period === key ? "text-indigo-400 font-medium" : "text-slate-400"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold block mb-2">Export Format</label>
            <div className="grid grid-cols-2 gap-3">
              <FormatPill fmt="pdf"  selected={format === "pdf"}  onClick={() => setFormat("pdf")} />
              <FormatPill fmt="xlsx" selected={format === "xlsx"} onClick={() => setFormat("xlsx")} />
            </div>
          </div>

          {/* What you'll get */}
          <div className={`rounded-xl border p-4 ${format === "pdf" ? "bg-indigo-500/5 border-indigo-500/15" : "bg-emerald-500/5 border-emerald-500/15"}`}>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-2">What you'll get</p>
            <ul className="space-y-1">
              {(format === "pdf" ? PDF_FEATURES : XLSX_FEATURES).map((item) => (
                <li key={item} className="flex items-start gap-2 text-[11px] text-slate-400">
                  <CheckCircle2 size={11} className={`${format === "pdf" ? "text-indigo-400" : "text-emerald-400"} shrink-0 mt-0.5`} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Download action */}
        <div className="px-6 pb-6 flex items-center gap-3 flex-wrap">
          <DownloadButton format={format} period={period} workspaceId={workspaceId} />
          <span className="text-[11px] text-slate-600">
            Generated server-side · live data · {PERIOD_LABELS[period]}
          </span>
        </div>
      </div>

      {/* Comparison table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300">PDF vs XLSX — When to Use Each</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Feature</th>
                <th className="px-6 py-3 text-center text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">PDF</th>
                <th className="px-6 py-3 text-center text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">XLSX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {COMPARISON.map(([label, hasPdf, hasXlsx]) => (
                <tr key={String(label)} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-3 text-slate-400 text-[12px]">{label}</td>
                  <td className="px-6 py-3 text-center">
                    {hasPdf ? <CheckCircle2 size={14} className="text-emerald-400 mx-auto" /> : <span className="text-slate-700">—</span>}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {hasXlsx ? <CheckCircle2 size={14} className="text-emerald-400 mx-auto" /> : <span className="text-slate-700">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
