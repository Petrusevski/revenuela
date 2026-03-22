import { prisma } from "../db";

// ── Activity score deltas ─────────────────────────────────────────────────────
// Positive = contact showed buying intent; Negative = signals dropped out
// Total delta is capped at ±30 per-lead to prevent runaway scores

export const ACTIVITY_DELTA: Record<string, number> = {
  deal_won:              +20,
  meeting_booked:        +15,
  reply_received:        +10,
  email_replied:         +10,
  linkedin_replied:      +10,
  linkedin_connected:    +5,
  email_clicked:         +5,
  email_opened:          +3,
  sequence_started:      +2,
  deal_lost:             -15,
  sequence_ended:        -3,
};

export function applyActivityDeltas(
  baseScore: number,
  activities: { type: string }[],
): number {
  let delta = 0;
  for (const act of activities) {
    delta += ACTIVITY_DELTA[act.type] ?? 0;
  }
  delta = Math.max(-30, Math.min(30, delta));
  return Math.max(0, Math.min(100, baseScore + delta));
}

/**
 * Apply the delta for a single new event to a lead's stored fitScore.
 * Called immediately after prisma.activity.create() so the score is
 * always current without requiring a manual "Score All" run.
 */
export async function updateLeadScoreForEvent(
  leadId: string,
  eventType: string,
): Promise<void> {
  const delta = ACTIVITY_DELTA[eventType] ?? 0;
  if (delta === 0) return;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { fitScore: true },
  });
  if (!lead) return;

  // If not yet ICP-scored, start from 25 (neutral cold baseline)
  const base = lead.fitScore ?? 25;
  await prisma.lead.update({
    where: { id: leadId },
    data: { fitScore: Math.max(0, Math.min(100, base + delta)) },
  });
}
