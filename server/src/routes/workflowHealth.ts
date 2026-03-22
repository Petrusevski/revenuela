import { Router, Request, Response } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

const PERIOD_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "all": 9999 };

const OUTREACH_EVENTS = new Set([
  "email_sent", "sequence_started", "message_sent",
  "connection_sent", "connection_request_sent",
]);
const POSITIVE_EVENTS = new Set([
  "reply_received", "meeting_booked", "deal_won", "deal_created",
]);

function hf(h: number): string {
  if (h < 1)   return `${Math.round(h * 60)}m`;
  if (h < 24)  return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/workflow-health?workspaceId=&period=30d
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const workspaceId = req.query.workspaceId as string;
  const period      = (req.query.period as string) ?? "30d";
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });

  const days  = PERIOD_DAYS[period] ?? 30;
  const since = days < 9999 ? new Date(Date.now() - days * 86400000) : new Date(0);

  try {
    // ── All touchpoints in period (for frequency / latency / paths) ──────────
    const periodTps = await prisma.touchpoint.findMany({
      where: { workspaceId, recordedAt: { gte: since } },
      select: { iqLeadId: true, tool: true, eventType: true, recordedAt: true },
      orderBy: { recordedAt: "asc" },
    });

    // ── All-time import events (for latency & coverage) ────────────────────
    const importTps = await prisma.touchpoint.findMany({
      where: { workspaceId, eventType: "lead_imported" },
      select: { iqLeadId: true, recordedAt: true },
      orderBy: { recordedAt: "asc" },
    });

    // ── All-time outreach (for coverage gaps) ──────────────────────────────
    const allOutreachTps = await prisma.touchpoint.findMany({
      where: { workspaceId, eventType: { in: [...OUTREACH_EVENTS] } },
      select: { iqLeadId: true },
      distinct: ["iqLeadId"],
    });

    // ── All-time full touchpoints (for funnel) ─────────────────────────────
    const allTps = await prisma.touchpoint.findMany({
      where: { workspaceId },
      select: { iqLeadId: true, eventType: true },
    });

    // ── Outcomes in period ─────────────────────────────────────────────────
    const outcomes = await prisma.outcome.findMany({
      where: { workspaceId, recordedAt: { gte: since } },
      select: { iqLeadId: true, type: true },
    });

    // ── Enrichment touchpoints (all-time) ─────────────────────────────────
    const enrichTps = await prisma.touchpoint.findMany({
      where: { workspaceId, eventType: "lead_enriched" },
      select: { iqLeadId: true, recordedAt: true },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 1. SIGNAL-TO-ACTION LATENCY
    // ─────────────────────────────────────────────────────────────────────────
    const firstImport = new Map<string, Date>();
    for (const tp of importTps) {
      const ex = firstImport.get(tp.iqLeadId);
      if (!ex || tp.recordedAt < ex) firstImport.set(tp.iqLeadId, tp.recordedAt);
    }

    // group period touchpoints by lead
    const byLead = new Map<string, { eventType: string; tool: string; recordedAt: Date }[]>();
    for (const tp of periodTps) {
      if (!byLead.has(tp.iqLeadId)) byLead.set(tp.iqLeadId, []);
      byLead.get(tp.iqLeadId)!.push(tp);
    }

    const latencyHours: number[] = [];
    for (const [leadId, events] of byLead) {
      const importTime = firstImport.get(leadId);
      if (!importTime) continue;
      const firstOut = events.find(e => OUTREACH_EVENTS.has(e.eventType));
      if (!firstOut) continue;
      const h = (firstOut.recordedAt.getTime() - importTime.getTime()) / 3_600_000;
      if (h >= 0) latencyHours.push(h);
    }

    const latencyBuckets = [
      { label: "< 4 hours",  min: 0,   max: 4,        count: 0, color: "emerald" },
      { label: "4–24 hours", min: 4,   max: 24,       count: 0, color: "blue"    },
      { label: "1–3 days",   min: 24,  max: 72,       count: 0, color: "amber"   },
      { label: "3–7 days",   min: 72,  max: 168,      count: 0, color: "orange"  },
      { label: "> 7 days",   min: 168, max: Infinity,  count: 0, color: "rose"    },
    ];
    for (const h of latencyHours) {
      const b = latencyBuckets.find(b => h >= b.min && h < b.max);
      if (b) b.count++;
    }
    const avgLatency = latencyHours.length
      ? latencyHours.reduce((a, b) => a + b, 0) / latencyHours.length : null;
    const sortedLat  = [...latencyHours].sort((a, b) => a - b);
    const medLatency = sortedLat.length ? sortedLat[Math.floor(sortedLat.length / 2)] : null;
    const fastCount  = latencyBuckets[0].count;
    const fastPct    = latencyHours.length ? (fastCount / latencyHours.length) * 100 : 0;

    // ─────────────────────────────────────────────────────────────────────────
    // 2. CONTACT FREQUENCY
    // ─────────────────────────────────────────────────────────────────────────
    const last7 = new Date(Date.now() - 7 * 86_400_000);
    const freq7 = new Map<string, number>();
    for (const tp of periodTps) {
      if (tp.recordedAt >= last7) {
        freq7.set(tp.iqLeadId, (freq7.get(tp.iqLeadId) ?? 0) + 1);
      }
    }

    const freqBuckets = [
      { label: "No contact",   range: "0",    min: 0,  max: 0,        count: 0, color: "slate"   },
      { label: "Light",        range: "1-2",  min: 1,  max: 2,        count: 0, color: "blue"    },
      { label: "Healthy",      range: "3-5",  min: 3,  max: 5,        count: 0, color: "emerald" },
      { label: "High",         range: "6-9",  min: 6,  max: 9,        count: 0, color: "amber"   },
      { label: "Over-touched", range: "10+",  min: 10, max: Infinity,  count: 0, color: "rose"    },
    ];
    freqBuckets[0].count = byLead.size - freq7.size;
    for (const [, c] of freq7) {
      const b = freqBuckets.find(b => c >= b.min && c <= (b.max === Infinity ? Infinity : b.max));
      if (b) b.count++;
    }

    const overTouchedIds = [...freq7.entries()]
      .filter(([, c]) => c >= 6)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const overTouchedLeads = await prisma.iqLead.findMany({
      where: { workspaceId, id: { in: overTouchedIds } },
      select: { id: true, displayName: true, company: true, title: true },
    });
    const overTouchedWithCount = overTouchedLeads
      .map(l => ({ displayName: l.displayName ?? "Unknown", company: l.company ?? "—", title: l.title ?? "", count: freq7.get(l.id) ?? 0 }))
      .sort((a, b) => b.count - a.count);

    const overTouchedCount = [...freq7.values()].filter(c => c >= 10).length;
    const overTouchedPct   = byLead.size > 0 ? overTouchedCount / byLead.size : 0;

    // ─────────────────────────────────────────────────────────────────────────
    // 3. COVERAGE GAPS
    // ─────────────────────────────────────────────────────────────────────────
    const withOutreach = new Set(allOutreachTps.map(t => t.iqLeadId));
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
    let gapCount = 0;
    for (const [leadId, importTime] of firstImport) {
      if (importTime < sevenDaysAgo && !withOutreach.has(leadId)) gapCount++;
    }
    const totalImported = firstImport.size;
    const gapPct = totalImported > 0 ? gapCount / totalImported : 0;

    // ─────────────────────────────────────────────────────────────────────────
    // 4. STEP FUNNEL (all-time)
    // ─────────────────────────────────────────────────────────────────────────
    const eventLeads = new Map<string, Set<string>>();
    for (const tp of allTps) {
      if (!eventLeads.has(tp.eventType)) eventLeads.set(tp.eventType, new Set());
      eventLeads.get(tp.eventType)!.add(tp.iqLeadId);
    }
    function unionCount(events: string[]): number {
      const u = new Set<string>();
      for (const e of events) eventLeads.get(e)?.forEach(id => u.add(id));
      return u.size;
    }
    const FUNNEL = [
      { label: "Imported",  events: ["lead_imported"] },
      { label: "Enriched",  events: ["lead_enriched"] },
      { label: "Contacted", events: ["email_sent","sequence_started","message_sent","connection_sent","connection_request_sent"] },
      { label: "Engaged",   events: ["email_opened","email_clicked","link_clicked"] },
      { label: "Replied",   events: ["reply_received"] },
      { label: "Meeting",   events: ["meeting_booked"] },
      { label: "Won",       events: ["deal_won"] },
    ];
    const funnelSteps = FUNNEL.map((step, i) => {
      const count    = unionCount(step.events);
      const prev     = i > 0 ? unionCount(FUNNEL[i - 1].events) : count;
      const pct      = i === 0 || prev === 0 ? 100 : Math.round((count / prev) * 100);
      const dropPct  = i === 0 ? null : 100 - pct;
      return { label: step.label, count, pct, dropPct };
    });
    let biggestDrop = ""; let maxDrop = 0;
    for (const s of funnelSteps) {
      if (s.dropPct !== null && s.dropPct > maxDrop) { maxDrop = s.dropPct; biggestDrop = s.label; }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. PATH ATTRIBUTION
    // ─────────────────────────────────────────────────────────────────────────
    const outcomeLeads = new Set(outcomes.map(o => o.iqLeadId));
    const pathMap = new Map<string, { count: number; outcomes: number }>();
    for (const [leadId, events] of byLead) {
      const path: string[] = [];
      for (const e of events) {
        if (!OUTREACH_EVENTS.has(e.eventType) && !POSITIVE_EVENTS.has(e.eventType)) continue;
        if (path[path.length - 1] !== e.eventType) path.push(e.eventType);
        if (path.length >= 5) break;
      }
      if (path.length < 2) continue;
      const key = path.join(" → ");
      const ex  = pathMap.get(key) ?? { count: 0, outcomes: 0 };
      ex.count++;
      if (outcomeLeads.has(leadId)) ex.outcomes++;
      pathMap.set(key, ex);
    }
    const topPaths = [...pathMap.entries()]
      .map(([key, d]) => ({
        path: key.split(" → "),
        count: d.count,
        outcomes: d.outcomes,
        convRate: d.count > 0 ? Math.round((d.outcomes / d.count) * 100) : 0,
      }))
      .filter(p => p.count >= 2)
      .sort((a, b) => b.outcomes - a.outcomes || b.count - a.count)
      .slice(0, 6);

    // ─────────────────────────────────────────────────────────────────────────
    // 6. ENRICHMENT STALENESS (active leads only)
    // ─────────────────────────────────────────────────────────────────────────
    const last30 = new Date(Date.now() - 30 * 86_400_000);
    const recentActive = new Set<string>();
    for (const tp of periodTps) {
      if (tp.recordedAt >= last30 && OUTREACH_EVENTS.has(tp.eventType)) {
        recentActive.add(tp.iqLeadId);
      }
    }

    const lastEnrich = new Map<string, Date>();
    for (const tp of enrichTps) {
      const ex = lastEnrich.get(tp.iqLeadId);
      if (!ex || tp.recordedAt > ex) lastEnrich.set(tp.iqLeadId, tp.recordedAt);
    }

    const enrichBuckets = [
      { label: "Fresh",      days: "< 30 days",   min: 0,   max: 30,       count: 0, color: "emerald" },
      { label: "Aging",      days: "30–90 days",  min: 30,  max: 90,       count: 0, color: "blue"    },
      { label: "Stale",      days: "90–180 days", min: 90,  max: 180,      count: 0, color: "amber"   },
      { label: "Very Stale", days: "> 180 days",  min: 180, max: Infinity,  count: 0, color: "rose"    },
    ];
    let neverEnriched = 0; let activeWithStale = 0; let freshEnrichCount = 0;
    for (const leadId of recentActive) {
      const le = lastEnrich.get(leadId);
      if (!le) { neverEnriched++; continue; }
      const daysAgo = (Date.now() - le.getTime()) / 86_400_000;
      const b = enrichBuckets.find(b => daysAgo >= b.min && daysAgo < b.max);
      if (b) {
        b.count++;
        if (daysAgo >= 90)  activeWithStale++;
        if (daysAgo < 30)   freshEnrichCount++;
      }
    }
    const activeTotal    = recentActive.size;
    const freshEnrichPct = activeTotal > 0 ? (freshEnrichCount / activeTotal) * 100 : 100;

    // ─────────────────────────────────────────────────────────────────────────
    // COMPOSITE HEALTH SCORE (0–100)
    // ─────────────────────────────────────────────────────────────────────────
    const scores = [
      Math.min(25, fastPct * 0.25),
      Math.min(25, (1 - overTouchedPct) * 25),
      Math.min(25, (1 - gapPct) * 25),
      Math.min(25, freshEnrichPct * 0.25),
    ];
    const healthScore = Math.round(scores.reduce((a, b) => a + b, 0));

    return res.json({
      period,
      healthScore,
      latency: {
        buckets: latencyBuckets,
        avgHours:    avgLatency    !== null ? +avgLatency.toFixed(1)    : null,
        medianHours: medLatency    !== null ? +medLatency.toFixed(1)    : null,
        avgFormatted:    avgLatency    !== null ? hf(avgLatency)    : null,
        medianFormatted: medLatency    !== null ? hf(medLatency)    : null,
        fastPct:     Math.round(fastPct),
        totalMeasured: latencyHours.length,
        insight: latencyHours.length === 0
          ? "No latency data — connect a tool and start importing leads"
          : fastPct >= 50
          ? `${Math.round(fastPct)}% of leads contacted within 4 hours of import`
          : `Only ${Math.round(fastPct)}% contacted within 4 hours — slow response is costing conversions`,
      },
      frequency: {
        buckets: freqBuckets,
        overTouchedCount,
        overTouchedLeads: overTouchedWithCount,
        insight: overTouchedCount === 0
          ? "No over-touched leads detected this week"
          : `${overTouchedCount} lead${overTouchedCount !== 1 ? "s" : ""} hit 10+ touches/week — high unsubscribe risk`,
      },
      coverage: {
        totalImported,
        withOutreach: totalImported - gapCount,
        gaps:    gapCount,
        gapPct:  Math.round(gapPct * 100),
        insight: gapCount === 0
          ? "All imported leads have received outreach"
          : `${gapCount} imported lead${gapCount !== 1 ? "s" : ""} (${Math.round(gapPct * 100)}%) never received any outreach`,
      },
      funnel: { steps: funnelSteps, biggestDrop },
      paths:  { top: topPaths, totalWithOutcome: outcomeLeads.size },
      enrichment: {
        buckets: enrichBuckets,
        activeWithStale,
        neverEnriched,
        freshEnrichPct: Math.round(freshEnrichPct),
        activeTotal,
        insight: neverEnriched > 0
          ? `${neverEnriched} active lead${neverEnriched !== 1 ? "s" : ""} were never enriched — sequences running on incomplete data`
          : activeWithStale > 0
          ? `${activeWithStale} active lead${activeWithStale !== 1 ? "s" : ""} with enrichment older than 90 days`
          : "Enrichment data is current across all active leads",
      },
    });

  } catch (err) {
    console.error("[workflow-health]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
