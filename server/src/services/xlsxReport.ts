import ExcelJS from "exceljs";
import { Response } from "express";
import { GTMReportData } from "./pdfReport";

// ── Styles ─────────────────────────────────────────────────────────────────────
const STYLES = {
  headerFill:  { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1E293B" } },
  accentFill:  { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF6366F1" } },
  goodFill:    { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFD1FAE5" } },
  warnFill:    { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFEF3C7" } },
  badFill:     { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFEE2E2" } },
  altFill:     { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFF8FAFC" } },
  headerFont:  { bold: true, color: { argb: "FFFFFFFF" }, size: 10, name: "Calibri" },
  boldFont:    { bold: true, size: 10, name: "Calibri" },
  normFont:    { size: 10, name: "Calibri" },
  border: {
    top:    { style: "thin" as const, color: { argb: "FFE2E8F0" } },
    bottom: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
    left:   { style: "thin" as const, color: { argb: "FFE2E8F0" } },
    right:  { style: "thin" as const, color: { argb: "FFE2E8F0" } },
  },
};

function applyHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = STYLES.headerFill;
    cell.font = STYLES.headerFont;
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = STYLES.border;
  });
  row.height = 24;
}

function applyDataRow(row: ExcelJS.Row, alt: boolean, statusKey?: string, value?: number|null) {
  let fill: typeof STYLES.goodFill | undefined;
  if (statusKey && value !== null && value !== undefined) {
    const thresholds: Record<string, [number, number, boolean]> = {
      bounceRate:  [2, 5, false],
      unsubRate:   [0.5, 1, false],
      openRate:    [40, 20, true],
      replyRate:   [3, 1, true],
      meetingRate: [10, 5, true],
    };
    const t = thresholds[statusKey];
    if (t) {
      const [good, warn, higher] = t;
      if (higher ? value >= good : value <= good) fill = STYLES.goodFill;
      else if (higher ? value >= warn : value <= warn) fill = STYLES.warnFill;
      else fill = STYLES.badFill;
    }
  }

  row.eachCell((cell) => {
    cell.fill = fill ?? (alt ? STYLES.altFill : { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } });
    cell.font = STYLES.normFont;
    cell.alignment = { vertical: "middle" };
    cell.border = STYLES.border;
  });
  row.height = 20;
}

function addSheetTitle(sheet: ExcelJS.Worksheet, title: string, subtitle: string, cols: number) {
  const titleRow = sheet.addRow([title]);
  titleRow.getCell(1).font = { bold: true, size: 14, name: "Calibri", color: { argb: "FF1E293B" } };
  titleRow.height = 30;
  sheet.mergeCells(`A1:${String.fromCharCode(64 + cols)}1`);

  const subRow = sheet.addRow([subtitle]);
  subRow.getCell(1).font = { size: 9, name: "Calibri", color: { argb: "FF64748B" } };
  subRow.height = 18;
  sheet.mergeCells(`A2:${String.fromCharCode(64 + cols)}2`);

  sheet.addRow([]); // spacer
}

// ── MAIN EXPORT ────────────────────────────────────────────────────────────────

export async function generateGTMReportXLSX(data: GTMReportData, res: Response) {
  const wb = new ExcelJS.Workbook();
  wb.creator  = "iqpipe";
  wb.created  = new Date();
  wb.modified = new Date();
  wb.title    = `GTM Health Report — ${data.workspace.name}`;

  // ────────────────────────────────────────────────────────────────────────────
  // SHEET 1: Overview
  // ────────────────────────────────────────────────────────────────────────────
  const overview = wb.addWorksheet("Overview");
  overview.columns = [
    { key: "label", width: 28 },
    { key: "value", width: 22 },
    { key: "note",  width: 40 },
  ];
  addSheetTitle(overview, `GTM Health Report — ${data.workspace.name}`, `Period: ${data.period} · Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 3);

  const hdr = overview.addRow(["Metric", "Value", "Notes"]);
  applyHeaderRow(hdr);

  const p = data.pipeline;
  const overallConv = p.sourced > 0 ? +((p.dealsWon / p.sourced) * 100).toFixed(2) : 0;

  const overviewData = [
    ["Leads Sourced",          p.sourced,          "Unique leads imported or enriched"],
    ["Leads Enriched",         p.enriched,         `${p.sourced > 0 ? Math.round((p.enriched/p.sourced)*100) : 0}% of sourced`],
    ["Leads Contacted",        p.contacted,        "Entered a sequence or received a message"],
    ["Leads Replied",          p.replied,          "At least one reply received"],
    ["Meetings Booked",        p.meetings,         "meeting_booked events"],
    ["Deals Won",              p.dealsWon,         "deal_won events"],
    ["Source → Won Rate",      `${overallConv}%`,  "Overall conversion rate"],
    ["",                       "",                 ""],
    ["Emails Sent",            data.metrics.emailsSent,          "Total across all email tools"],
    ["Open Rate",              data.metrics.openRate   !== null ? `${data.metrics.openRate}%`   : "—", "Target: 40-60%"],
    ["Reply Rate",             data.metrics.replyRate  !== null ? `${data.metrics.replyRate}%`  : "—", "Target: 3-8%"],
    ["Bounce Rate",            data.metrics.bounceRate !== null ? `${data.metrics.bounceRate}%` : "—", "Target: <2%"],
    ["Unsubscribe Rate",       data.metrics.unsubRate  !== null ? `${data.metrics.unsubRate}%`  : "—", "Target: <0.5%"],
    ["Reply → Meeting Rate",   data.metrics.meetingRate !== null ? `${data.metrics.meetingRate}%` : "—", "Target: >10%"],
    ["Pipeline Value",         data.metrics.totalPipelineValue > 0 ? `$${data.metrics.totalPipelineValue.toLocaleString()}` : "—", "Sum of deal_won outcomes"],
  ];

  overviewData.forEach((row, i) => {
    const r = overview.addRow(row);
    applyDataRow(r, i % 2 === 0);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SHEET 2: Pipeline
  // ────────────────────────────────────────────────────────────────────────────
  const pipeline = wb.addWorksheet("Pipeline");
  pipeline.columns = [
    { key: "stage",     width: 20 },
    { key: "count",     width: 16 },
    { key: "pctSrc",    width: 18 },
    { key: "stageConv", width: 18 },
    { key: "dropOff",   width: 18 },
  ];
  addSheetTitle(pipeline, "Pipeline Funnel", `${data.workspace.name} · ${data.period}`, 5);

  const ph = pipeline.addRow(["Stage", "Count", "% of Sourced", "Stage Conversion", "Drop-off"]);
  applyHeaderRow(ph);

  const stages = [
    { label: "Sourced",   count: p.sourced,    prev: p.sourced },
    { label: "Enriched",  count: p.enriched,   prev: p.sourced },
    { label: "Contacted", count: p.contacted,  prev: p.sourced },
    { label: "Replied",   count: p.replied,    prev: p.contacted },
    { label: "Meeting",   count: p.meetings,   prev: p.replied },
    { label: "Won",       count: p.dealsWon,   prev: p.meetings },
  ];

  stages.forEach((s, i) => {
    const pctSrc  = p.sourced   > 0 ? `${Math.round((s.count / p.sourced) * 100)}%` : "—";
    const conv    = i === 0 || s.prev === 0 ? "—" : `${Math.round((s.count / s.prev) * 100)}%`;
    const drop    = i === 0 ? "—" : String(s.prev - s.count);
    const r = pipeline.addRow([s.label, s.count, pctSrc, conv, drop]);
    applyDataRow(r, i % 2 === 0);
    if (s.label === "Won") {
      r.eachCell((cell) => {
        cell.fill = STYLES.goodFill;
        cell.font = { ...STYLES.boldFont, color: { argb: "FF059669" } };
      });
    }
  });

  pipeline.getColumn("count").numFmt     = "#,##0";
  pipeline.getColumn("dropOff").numFmt   = "#,##0";

  // ────────────────────────────────────────────────────────────────────────────
  // SHEET 3: Metrics
  // ────────────────────────────────────────────────────────────────────────────
  const metrics = wb.addWorksheet("Outreach Metrics");
  metrics.columns = [
    { key: "metric",    width: 26 },
    { key: "value",     width: 16 },
    { key: "benchmark", width: 20 },
    { key: "status",    width: 14 },
    { key: "note",      width: 38 },
  ];
  addSheetTitle(metrics, "Outreach Performance", `${data.workspace.name} · ${data.period}`, 5);

  const mh = metrics.addRow(["Metric", "Value", "Benchmark", "Status", "Notes"]);
  applyHeaderRow(mh);

  const thresholds: Record<string, { bench: string; good: number; warn: number; higher: boolean }> = {
    openRate:    { bench: "40-60%",  good: 40,  warn: 20,  higher: true  },
    replyRate:   { bench: "3-8%",    good: 3,   warn: 1,   higher: true  },
    bounceRate:  { bench: "<2%",     good: 2,   warn: 5,   higher: false },
    unsubRate:   { bench: "<0.5%",   good: 0.5, warn: 1,   higher: false },
    meetingRate: { bench: ">10%",    good: 10,  warn: 5,   higher: true  },
  };

  const metricRows = [
    { label: "Open Rate",        key: "openRate",    val: data.metrics.openRate,    note: "email_opened / email_sent" },
    { label: "Reply Rate",       key: "replyRate",   val: data.metrics.replyRate,   note: "reply_received / email_sent" },
    { label: "Reply → Meeting",  key: "meetingRate", val: data.metrics.meetingRate, note: "meeting_booked / reply_received" },
    { label: "Bounce Rate",      key: "bounceRate",  val: data.metrics.bounceRate,  note: "email_bounced / email_sent" },
    { label: "Unsubscribe Rate", key: "unsubRate",   val: data.metrics.unsubRate,   note: "unsubscribed / email_sent" },
  ];

  metricRows.forEach((item, i) => {
    const t = thresholds[item.key];
    let status = "—";
    let fill: typeof STYLES.goodFill | undefined;
    if (item.val !== null && t) {
      const good = t.higher ? item.val >= t.good : item.val <= t.good;
      const warn = t.higher ? item.val >= t.warn : item.val <= t.warn;
      status = good ? "✓ Good" : warn ? "⚠ Warning" : "✗ Poor";
      fill   = good ? STYLES.goodFill : warn ? STYLES.warnFill : STYLES.badFill;
    }
    const r = metrics.addRow([
      item.label,
      item.val !== null ? `${item.val}%` : "—",
      t?.bench ?? "—",
      status,
      item.note,
    ]);
    applyDataRow(r, i % 2 === 0, item.key, item.val);
    if (fill) {
      r.getCell(4).fill = fill;
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SHEET 4: Stack
  // ────────────────────────────────────────────────────────────────────────────
  const stack = wb.addWorksheet("Stack");
  stack.columns = [
    { key: "category", width: 20 },
    { key: "tool",     width: 28 },
    { key: "toolId",   width: 22 },
  ];
  addSheetTitle(stack, "Connected Tool Stack", data.workspace.name, 3);

  const sh = stack.addRow(["Category", "Tool Name", "Tool ID"]);
  applyHeaderRow(sh);

  const CAT_LABELS: Record<string, string> = {
    aggregation: "Aggregation", enrichment: "Enrichment", activation: "Activation",
    crm: "CRM", billing: "Billing", infrastructure: "Infrastructure",
  };

  let sIdx = 0;
  for (const [cat, tools] of Object.entries(data.stack)) {
    for (const t of tools) {
      const r = stack.addRow([CAT_LABELS[cat] ?? cat, t.label, t.tool]);
      applyDataRow(r, sIdx % 2 === 0);
      sIdx++;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SHEET 5: Signal Activity
  // ────────────────────────────────────────────────────────────────────────────
  const signals = wb.addWorksheet("Signal Activity");
  signals.columns = [
    { key: "tier",       width: 12 },
    { key: "tierLabel",  width: 26 },
    { key: "event",      width: 34 },
    { key: "count",      width: 16 },
    { key: "pctTotal",   width: 16 },
  ];
  addSheetTitle(signals, "Signal Activity by Tier", `${data.workspace.name} · ${data.period}`, 5);

  const siH = signals.addRow(["Tier", "Tier Label", "Event Type", "Count", "% of Total"]);
  applyHeaderRow(siH);

  const tierLabels: Record<number, string> = {
    1: "High Intent", 2: "Warm Signals", 3: "Cold Targeted", 4: "Experimental",
  };
  const tierFills: Record<number, typeof STYLES.goodFill> = {
    1: STYLES.goodFill,
    2: STYLES.warnFill,
    3: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E7FF" } },
    4: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } },
  };
  const totalEvents = data.signals.reduce((s, e) => s + e.count, 0) || 1;

  data.signals.forEach((s, i) => {
    const r = signals.addRow([
      s.tier,
      tierLabels[s.tier] ?? "Other",
      s.event,
      s.count,
      `${((s.count / totalEvents) * 100).toFixed(1)}%`,
    ]);
    applyDataRow(r, i % 2 === 0);
    r.getCell(1).fill = tierFills[s.tier] ?? STYLES.altFill;
    r.getCell(2).fill = tierFills[s.tier] ?? STYLES.altFill;
  });
  signals.getColumn("count").numFmt = "#,##0";

  // ────────────────────────────────────────────────────────────────────────────
  // SHEET 6: Tool Health
  // ────────────────────────────────────────────────────────────────────────────
  if (data.tools.length > 0) {
    const health = wb.addWorksheet("Tool Health");
    health.columns = [
      { key: "label",   width: 22 },
      { key: "channel", width: 16 },
      { key: "status",  width: 14 },
      { key: "ev24h",   width: 16 },
      { key: "ev7d",    width: 16 },
      { key: "lastAt",  width: 28 },
    ];
    addSheetTitle(health, "Per-Tool Signal Health", data.workspace.name, 6);

    const hh = health.addRow(["Tool", "Channel", "Status", "Events 24h", "Events 7d", "Last Event"]);
    applyHeaderRow(hh);

    const statusFills: Record<string, typeof STYLES.goodFill> = {
      healthy: STYLES.goodFill, warning: STYLES.warnFill, silent: STYLES.badFill, never: STYLES.altFill,
    };

    data.tools.forEach((t, i) => {
      const r = health.addRow([
        t.label, t.channel, t.status, t.events24h, t.events7d,
        t.lastEventAt ? new Date(t.lastEventAt).toLocaleString() : "—",
      ]);
      applyDataRow(r, i % 2 === 0);
      r.getCell(3).fill = statusFills[t.status] ?? STYLES.altFill;
    });
    health.getColumn("ev24h").numFmt = "#,##0";
    health.getColumn("ev7d").numFmt  = "#,##0";
  }

  // ── Stream response ──────────────────────────────────────────────────────────
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  await wb.xlsx.write(res);
}
