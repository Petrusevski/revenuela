/**
 * devSeed.ts
 *
 * POST /api/dev/seed
 *
 * Seeds realistic GTM pipeline mock data into the authenticated user's
 * primary workspace so all pages render with convincing demo visuals.
 *
 * Idempotent — won't double-seed if called twice (checks IqLead count first).
 * Safe in production — protected by requireAuth, user can only seed their own workspace.
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { encrypt } from "../utils/encryption";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
function mintId(): string {
  let id = "iq_";
  const bytes = crypto.randomBytes(12);
  for (let i = 0; i < 12; i++) id += CHARS[bytes[i] % CHARS.length];
  return id;
}

const HASH_KEY = process.env.LEAD_HASH_KEY || "iqpipe-identity-hmac-v1-change-in-prod";
function hmac(v: string) {
  return crypto.createHmac("sha256", HASH_KEY).update(v).digest("hex");
}

function daysAgo(d: number, jitterHours = 0): Date {
  const ms = Date.now() - d * 86_400_000 - jitterHours * 3_600_000;
  return new Date(ms);
}

// Realistic contacts
const CONTACTS = [
  { first: "Sarah",   last: "Mitchell",  email: "sarah.mitchell@notion.so",     company: "Notion",       title: "Head of RevOps" },
  { first: "James",   last: "Chen",      email: "j.chen@linear.app",            company: "Linear",       title: "VP of Growth" },
  { first: "Priya",   last: "Sharma",    email: "priya@vercel.com",             company: "Vercel",       title: "Director of Sales" },
  { first: "Tom",     last: "Erikson",   email: "tom.erikson@stripe.com",       company: "Stripe",       title: "Enterprise AE" },
  { first: "Laura",   last: "Becker",    email: "l.becker@figma.com",           company: "Figma",        title: "RevOps Manager" },
  { first: "Alex",    last: "Johnson",   email: "alex@loom.com",                company: "Loom",         title: "GTM Engineer" },
  { first: "Maria",   last: "Garcia",    email: "m.garcia@hubspot.com",         company: "HubSpot",      title: "Sales Ops Lead" },
  { first: "Daniel",  last: "Park",      email: "d.park@intercom.io",           company: "Intercom",     title: "Head of Sales Dev" },
  { first: "Emma",    last: "Wilson",    email: "emma.wilson@segment.com",      company: "Segment",      title: "Growth Engineer" },
  { first: "Lucas",   last: "Rossi",     email: "l.rossi@braze.com",            company: "Braze",        title: "Sales Engineer" },
  { first: "Ava",     last: "Thompson",  email: "ava.t@drift.com",              company: "Drift",        title: "RevOps Analyst" },
  { first: "Noah",    last: "White",     email: "noah@clickup.com",             company: "ClickUp",      title: "VP Sales" },
  { first: "Olivia",  last: "Brown",     email: "olivia.b@notion.so",           company: "Notion",       title: "Sales Manager" },
  { first: "Ethan",   last: "Davis",     email: "ethan.davis@rippling.com",     company: "Rippling",     title: "Director of RevOps" },
  { first: "Sophia",  last: "Martinez",  email: "s.martinez@apollo.io",         company: "Apollo",       title: "GTM Lead" },
  { first: "Mason",   last: "Anderson",  email: "mason.a@mixpanel.com",         company: "Mixpanel",     title: "Growth Ops" },
  { first: "Isabella","last": "Taylor",  email: "i.taylor@amplitude.com",       company: "Amplitude",    title: "VP Sales Engineering" },
  { first: "Logan",   last: "Moore",     email: "l.moore@planhat.com",          company: "Planhat",      title: "Head of Customer Success" },
  { first: "Mia",     last: "Jackson",   email: "mia.j@gong.io",               company: "Gong",         title: "RevOps Director" },
  { first: "Liam",    last: "Harris",    email: "liam.h@outreach.io",           company: "Outreach",     title: "Sales Dev Manager" },
  { first: "Charlotte","last": "Clark",  email: "c.clark@salesloft.com",        company: "Salesloft",    title: "Enterprise Sales" },
  { first: "Oliver",  last: "Lewis",     email: "o.lewis@zoominfo.com",         company: "ZoomInfo",     title: "GTM Ops Lead" },
  { first: "Amelia",  last: "Robinson",  email: "amelia.r@clay.com",            company: "Clay",         title: "Partner Engineer" },
  { first: "Elijah",  last: "Walker",    email: "e.walker@lemlist.com",         company: "Lemlist",      title: "Head of Growth" },
  { first: "Harper",  last: "Hall",      email: "harper.hall@instantly.ai",     company: "Instantly",    title: "Sales Ops" },
  { first: "Aiden",   last: "Young",     email: "aiden.y@smartlead.ai",         company: "Smartlead",    title: "GTM Analyst" },
  { first: "Evelyn",  last: "Allen",     email: "evelyn.a@pipedrive.com",       company: "Pipedrive",    title: "Sales Director" },
  { first: "Carter",  last: "Scott",     email: "c.scott@attio.com",            company: "Attio",        title: "Head of Sales" },
  { first: "Abigail", last: "Green",     email: "abigail.g@close.com",          company: "Close",        title: "RevOps Lead" },
  { first: "Jackson", last: "Adams",     email: "j.adams@chargebee.com",        company: "Chargebee",    title: "VP Revenue" },
  { first: "Emily",   last: "Nelson",    email: "emily.n@paddle.com",           company: "Paddle",       title: "Sales Engineer" },
  { first: "Sebastian","last": "Baker",  email: "s.baker@churnzero.com",        company: "ChurnZero",    title: "CS Operations" },
  { first: "Ella",    last: "Carter",    email: "ella.c@gainsight.com",         company: "Gainsight",    title: "Director of CS" },
  { first: "Jack",    last: "Mitchell",  email: "jack.m@totango.com",           company: "Totango",      title: "GTM Engineer" },
  { first: "Grace",   last: "Perez",     email: "grace.p@klenty.com",           company: "Klenty",       title: "Sales Ops Manager" },
  { first: "Owen",    last: "Roberts",   email: "owen.r@woodpecker.co",         company: "Woodpecker",   title: "Growth Lead" },
  { first: "Zoey",    last: "Turner",    email: "zoey.t@replyio.com",           company: "Reply.io",     title: "Partner Manager" },
  { first: "Wyatt",   last: "Phillips",  email: "w.phillips@salesforce.com",    company: "Salesforce",   title: "Enterprise Sales" },
  { first: "Lily",    last: "Campbell",  email: "lily.c@hubspot.com",           company: "HubSpot",      title: "Account Executive" },
  { first: "Henry",   last: "Parker",    email: "h.parker@marketo.com",         company: "Marketo",      title: "Marketing Ops" },
  { first: "Aria",    last: "Evans",     email: "aria.e@clearbit.com",          company: "Clearbit",     title: "Head of Data" },
  { first: "Grayson", last: "Edwards",   email: "g.edwards@lusha.com",          company: "Lusha",        title: "Sales Director" },
  { first: "Scarlett","last": "Collins",  email: "s.collins@zoominfo.com",      company: "ZoomInfo",     title: "RevOps Analyst" },
  { first: "Julian",  last: "Stewart",   email: "j.stewart@cognism.com",        company: "Cognism",      title: "VP Sales EMEA" },
  { first: "Victoria","last": "Sanchez",  email: "v.sanchez@hunter.io",         company: "Hunter.io",    title: "GTM Lead" },
  { first: "Ryan",    last: "Morris",     email: "r.morris@snov.io",            company: "Snov.io",      title: "Sales Ops" },
  { first: "Penelope","last": "Rogers",   email: "p.rogers@rocketreach.co",     company: "RocketReach",  title: "Data Engineer" },
  { first: "Eli",     last: "Reed",       email: "eli.r@pdl.com",              company: "PDL",          title: "Partnerships" },
  { first: "Stella",  last: "Cook",       email: "stella.c@phantombuster.com",  company: "PhantomBuster",title: "Automation Engineer" },
  { first: "Nolan",   last: "Morgan",     email: "n.morgan@waalaxy.com",        company: "Waalaxy",      title: "Growth Engineer" },
];

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/dev/seed
// ─────────────────────────────────────────────────────────────────────────────

router.post("/seed", requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Resolve primary workspace
  const membership = await prisma.workspaceUser.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) return res.status(404).json({ error: "No workspace found." });

  const workspaceId = membership.workspace.id;

  // Idempotency — skip if already seeded
  const existing = await prisma.iqLead.count({ where: { workspaceId } });
  if (existing > 0) {
    return res.json({
      skipped: true,
      message: `Already seeded (${existing} IqLeads exist). Delete them first to re-seed.`,
    });
  }

  // ── 1. Create IntegrationConnections ─────────────────────────────────────

  const tools = [
    { provider: "clay",      label: "Clay" },
    { provider: "apollo",    label: "Apollo" },
    { provider: "heyreach",  label: "HeyReach" },
    { provider: "instantly", label: "Instantly" },
    { provider: "hubspot",   label: "HubSpot" },
    { provider: "stripe",    label: "Stripe" },
    { provider: "lemlist",   label: "Lemlist" },
  ];

  for (const tool of tools) {
    const existing = await prisma.integrationConnection.findFirst({
      where: { workspaceId, provider: tool.provider },
    });
    if (!existing) {
      await prisma.integrationConnection.create({
        data: {
          workspaceId,
          provider: tool.provider,
          status:   "connected",
          authData: encrypt(JSON.stringify({ apiKey: "demo-key", seeded: true })),
        },
      });
    }
  }

  // ── 2. Build funnel pipeline ──────────────────────────────────────────────

  // Funnel shape:
  //   50 sourced  (apollo + clay)
  //   43 enriched (clay)
  //   34 contacted (heyreach: 20, instantly: 14)
  //   17 engaged  (heyreach: 10 connection_accepted, instantly: 7 email_opened)
  //    8 replied  (heyreach: 5, instantly: 3)
  //    3 meeting_booked
  //    2 deal_created (hubspot)
  //    1 deal_won (stripe)

  const touchpointsBatch: any[] = [];
  const iqLeadIds: string[] = [];

  for (let i = 0; i < CONTACTS.length; i++) {
    const c       = CONTACTS[i];
    const iqId    = mintId();
    const eHash   = hmac(c.email.toLowerCase().trim());
    const eEnc    = encrypt(c.email.toLowerCase().trim());

    // Random timestamps spread over the past 30 days
    const sourcedAt   = daysAgo(28 - i * 0.5, Math.random() * 8);
    const enrichedAt  = new Date(sourcedAt.getTime() + 3_600_000 * 2);
    const contactAt   = new Date(sourcedAt.getTime() + 86_400_000 * (1 + Math.random()));
    const engageAt    = new Date(contactAt.getTime()  + 86_400_000 * (2 + Math.random() * 2));
    const replyAt     = new Date(engageAt.getTime()   + 86_400_000 * (1 + Math.random() * 3));
    const meetingAt   = new Date(replyAt.getTime()    + 86_400_000 * Math.random() * 2);
    const dealAt      = new Date(meetingAt.getTime()  + 86_400_000 * (2 + Math.random() * 3));
    const wonAt       = new Date(dealAt.getTime()     + 86_400_000 * (1 + Math.random() * 5));

    await prisma.iqLead.create({
      data: {
        id: iqId, workspaceId,
        emailHash: eHash, emailEnc: eEnc,
        displayName: `${c.first} ${c.last[0]}.`,
        company: c.company,
        title:   c.title,
      },
    });
    iqLeadIds.push(iqId);

    // Every lead: sourced
    const sourceTool = i % 3 === 0 ? "apollo" : "clay";
    touchpointsBatch.push({
      workspaceId, iqLeadId: iqId,
      tool: sourceTool, channel: "prospecting",
      eventType: "lead_imported",
      meta: JSON.stringify({ company: c.company, title: c.title, via: "seed" }),
      recordedAt: sourcedAt,
    });

    // 86% enriched
    if (i < 43) {
      touchpointsBatch.push({
        workspaceId, iqLeadId: iqId,
        tool: "clay", channel: "enrichment",
        eventType: "lead_enriched",
        meta: JSON.stringify({ company: c.company, title: c.title, via: "seed" }),
        recordedAt: enrichedAt,
      });
    }

    // 68% contacted
    if (i < 34) {
      const outTool   = i < 20 ? "heyreach"  : "instantly";
      const outCh     = i < 20 ? "linkedin"  : "email";
      const startEvt  = i < 20 ? "connection_sent" : "sequence_started";
      touchpointsBatch.push({
        workspaceId, iqLeadId: iqId,
        tool: outTool, channel: outCh,
        eventType: startEvt,
        meta: JSON.stringify({ campaign: i < 20 ? "Q1 LinkedIn Outreach" : "Q1 Email Blast", via: "seed" }),
        recordedAt: contactAt,
      });

      // Overlap: leads 10-13 contacted via BOTH heyreach and instantly
      if (i >= 10 && i < 14) {
        touchpointsBatch.push({
          workspaceId, iqLeadId: iqId,
          tool: "instantly", channel: "email",
          eventType: "sequence_started",
          meta: JSON.stringify({ campaign: "Q1 Email Blast", via: "seed", note: "overlap — also in HeyReach" }),
          recordedAt: new Date(contactAt.getTime() + 3_600_000 * 6),
        });
      }
    }

    // 34% engaged
    if (i < 17) {
      const engTool  = i < 10 ? "heyreach" : "instantly";
      const engCh    = i < 10 ? "linkedin" : "email";
      const engEvt   = i < 10 ? "connection_accepted" : "email_opened";
      touchpointsBatch.push({
        workspaceId, iqLeadId: iqId,
        tool: engTool, channel: engCh,
        eventType: engEvt,
        meta: JSON.stringify({ via: "seed" }),
        recordedAt: engageAt,
      });
    }

    // 16% replied
    if (i < 8) {
      const repTool = i < 5 ? "heyreach" : "instantly";
      const repCh   = i < 5 ? "linkedin" : "email";
      touchpointsBatch.push({
        workspaceId, iqLeadId: iqId,
        tool: repTool, channel: repCh,
        eventType: "reply_received",
        meta: JSON.stringify({ message: "Sounds interesting, let's chat.", via: "seed" }),
        recordedAt: replyAt,
      });
    }

    // 6% meeting
    if (i < 3) {
      touchpointsBatch.push({
        workspaceId, iqLeadId: iqId,
        tool: "hubspot", channel: "crm",
        eventType: "meeting_booked",
        meta: JSON.stringify({ duration: "30min", via: "seed" }),
        recordedAt: meetingAt,
      });
    }

    // 4% deal created
    if (i < 2) {
      touchpointsBatch.push({
        workspaceId, iqLeadId: iqId,
        tool: "hubspot", channel: "crm",
        eventType: "deal_created",
        meta: JSON.stringify({ amount: i === 0 ? 12400 : 8900, currency: "USD", via: "seed" }),
        recordedAt: dealAt,
      });
    }

    // 2% deal won
    if (i === 0) {
      touchpointsBatch.push({
        workspaceId, iqLeadId: iqId,
        tool: "stripe", channel: "billing",
        eventType: "deal_won",
        meta: JSON.stringify({ amount: 12400, currency: "USD", chargeId: "ch_demo_001", via: "seed" }),
        recordedAt: wonAt,
      });
    }
  }

  // Bulk-insert all touchpoints
  await prisma.touchpoint.createMany({ data: touchpointsBatch });

  res.json({
    seeded: true,
    workspace: membership.workspace.name,
    iqLeads:     CONTACTS.length,
    touchpoints: touchpointsBatch.length,
    tools:       tools.map((t) => t.provider),
    message: "Refresh any page to see the demo data.",
  });
});

export default router;
