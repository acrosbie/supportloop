import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabase";
import { embed, toVector } from "./embeddings";
import type { Urgency } from "./types";
import kbArticles from "../supabase/seed/kb-articles.json";
import communityData from "../supabase/seed/community.json";
import supportloopKb from "../supabase/seed/supportloop-kb.json";
import supportloopCommunity from "../supabase/seed/supportloop-community.json";
import { DEMO_ACCOUNTS, SUPPORTLOOP_ACCOUNTS } from "./demo-accounts";

// Shapes of the seed JSON files.
interface KbSeed {
  title: string;
  body: string;
  category: string;
  tags: string[];
}
interface CommunitySeed {
  title: string;
  body: string;
  status: "open" | "answered";
  has_kb_gap: boolean;
  answer?: string;
  answer_source?: "ai" | "user";
}

const TARGET_TICKETS = 200;
const DAYS = 90;

// Generic chunked insert.
async function insertAll(sb: SupabaseClient, table: string, rows: unknown[]): Promise<void> {
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await sb.from(table).insert(rows.slice(i, i + CHUNK));
    if (error) throw new Error(`insert ${table}: ${error.message}`);
  }
}

// Best-effort: embed resolved tickets so the agent copilot's "similar tickets"
// is semantic. No-ops gracefully if migration 0005 hasn't been applied yet.
async function embedResolvedTickets(sb: SupabaseClient, orgId: string, tickets: GenTicket[]): Promise<void> {
  const resolved = tickets.filter((t) => t.status === "resolved");
  if (!resolved.length) return;
  try {
    const vectors = await embed(resolved.map((t) => `${t.subject}\n\n${t.body}`), "document");
    for (let i = 0; i < resolved.length; i++) {
      const { error } = await sb
        .from("tickets")
        .update({ embedding: toVector(vectors[i]) })
        .eq("id", resolved[i].id)
        .eq("org_id", orgId);
      if (error) throw error;
    }
  } catch {
    /* embedding column not present yet — run migration 0005 + reseed */
  }
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Ticket templates — believable Orbit support volume for the dashboard.
// ---------------------------------------------------------------------------
const TICKET_TEMPLATES: {
  intent: string;
  queue: string;
  urgency: Urgency[];
  samples: { subject: string; body: string }[];
}[] = [
  {
    intent: "Billing",
    queue: "Billing",
    urgency: ["low", "medium", "medium", "high"],
    samples: [
      { subject: "Charged twice this month", body: "I see two charges for my Orbit Pro subscription on the same day. Can you help me understand why?" },
      { subject: "Refund for accidental upgrade", body: "I upgraded to Business by mistake and would like a refund back to my card." },
      { subject: "Update my card on file", body: "My credit card expired and my renewal failed. How do I update the payment method?" },
    ],
  },
  {
    intent: "Account access",
    queue: "Account",
    urgency: ["medium", "high", "high"],
    samples: [
      { subject: "Locked out of my account", body: "I forgot my password and the reset email never arrives. I need to get back in for a meeting." },
      { subject: "Can't sign in after SSO change", body: "Our company turned on SSO and now I can't log in with my old password." },
    ],
  },
  {
    intent: "Audio & Video",
    queue: "Technical",
    urgency: ["low", "medium", "medium"],
    samples: [
      { subject: "Microphone not working", body: "People in my meetings can't hear me even though my mic isn't muted." },
      { subject: "Camera shows a black screen", body: "My webcam light comes on but Orbit only shows a black screen." },
      { subject: "Bad echo on calls", body: "There's a constant echo whenever two of us join from the same room." },
    ],
  },
  {
    intent: "Meetings",
    queue: "Technical",
    urgency: ["low", "low", "medium"],
    samples: [
      { subject: "Meeting ends at 40 minutes", body: "Our group calls keep cutting off after 40 minutes. How do we stop that?" },
      { subject: "Can't share my screen", body: "The Share button is greyed out and I can't present my slides." },
    ],
  },
  {
    intent: "Recording",
    queue: "Recordings",
    urgency: ["low", "medium"],
    samples: [
      { subject: "Where are my recordings?", body: "I recorded a meeting to the cloud but can't find it under Recordings." },
      { subject: "Out of recording storage", body: "I got an email saying I'm out of cloud storage and recordings are paused." },
    ],
  },
  {
    intent: "Plans & upgrades",
    queue: "Billing",
    urgency: ["low", "medium"],
    samples: [
      { subject: "Downgrade to Pro", body: "I want to move from Business down to Pro at the end of the cycle." },
      { subject: "What does Business include?", body: "Trying to decide whether to upgrade — how much recording storage and how many participants do I get?" },
    ],
  },
  {
    intent: "Security/SSO",
    queue: "Admin",
    urgency: ["medium", "high"],
    samples: [
      { subject: "Set up SSO with Okta", body: "We're on Business and want everyone to log in through Okta. Where do I configure it?" },
      { subject: "Require 2FA org-wide", body: "Security wants two-factor enforced for all members. Is there an org setting?" },
    ],
  },
  {
    intent: "Getting started",
    queue: "Technical",
    urgency: ["low", "low"],
    samples: [
      { subject: "How do I join from a link?", body: "Someone sent me a meeting link — do I need to install anything to join?" },
      { subject: "Schedule a recurring meeting", body: "How do I set up a weekly standup with the same link each time?" },
    ],
  },
];

// Dogfood templates — support questions a SupportLoop customer (a support team)
// would actually file about the product itself.
const SUPPORTLOOP_TEMPLATES: typeof TICKET_TEMPLATES = [
  {
    intent: "Knowledge import",
    queue: "Onboarding",
    urgency: ["low", "medium", "medium"],
    samples: [
      { subject: "Bulk import from Zendesk", body: "We have ~300 articles in Zendesk. What's the fastest way to get them into our workspace?" },
      { subject: "Markdown upload didn't embed", body: "I uploaded a few markdown files but the assistant doesn't find them yet. How long does embedding take?" },
    ],
  },
  {
    intent: "AI quality",
    queue: "AI",
    urgency: ["medium", "high"],
    samples: [
      { subject: "Assistant escalates too often", body: "The bot is opening tickets for questions I'm sure are covered. How do I see what it retrieved?" },
      { subject: "Bot answered with an old policy", body: "We updated our refund window but the assistant quoted the old one. How do I refresh it?" },
    ],
  },
  {
    intent: "Threshold",
    queue: "AI",
    urgency: ["low", "medium"],
    samples: [
      { subject: "Tune the similarity threshold", body: "Where do I change how strict the grounding threshold is, and how do I tell if I broke something?" },
    ],
  },
  {
    intent: "Widget",
    queue: "Onboarding",
    urgency: ["low", "medium"],
    samples: [
      { subject: "Embed the widget on Webflow", body: "How do I add the chat widget to a Webflow site? Do I need a developer?" },
      { subject: "Match the widget to our brand", body: "Can I change the widget colors to match our brand palette?" },
    ],
  },
  {
    intent: "Billing",
    queue: "Billing",
    urgency: ["low", "medium"],
    samples: [
      { subject: "Add two agent seats", body: "We're hiring two more reps — how do I add seats and what's the cost?" },
      { subject: "Upgrade to the Team plan", body: "We want KB import and evals. How do we move from Free to Team?" },
    ],
  },
  {
    intent: "Routing",
    queue: "Operations",
    urgency: ["low", "medium"],
    samples: [
      { subject: "Set SLA targets per priority", body: "I want urgent tickets to have a 2-hour SLA. Where do I configure SLA per priority?" },
      { subject: "Auto-assign by queue", body: "Can tickets in the Billing queue route automatically to our billing specialist?" },
    ],
  },
  {
    intent: "Team",
    queue: "Account",
    urgency: ["low", "low"],
    samples: [
      { subject: "Invite my team", body: "How do I invite teammates and set them as agents vs admins?" },
      { subject: "Make an agent an admin", body: "I need to give one of my agents admin access to manage the knowledge base." },
    ],
  },
  {
    intent: "Analytics",
    queue: "Operations",
    urgency: ["low", "medium"],
    samples: [
      { subject: "Deflection rate looks low", body: "Our deflection is lower than expected in week one. Is that normal, and how do we improve it?" },
      { subject: "Export the dashboard", body: "Can I export deflection and CSAT for a weekly report to leadership?" },
    ],
  },
];

const SENTIMENTS_POSITIVE = ["satisfied", "neutral", "neutral", "satisfied"];
const SENTIMENTS_NEGATIVE = ["frustrated", "urgent", "confused", "frustrated"];

const CANNED = [
  {
    title: "Ask for more details",
    body: "Thanks for reaching out! Could you share a bit more — which device and Orbit version you're on, and the exact steps that led to the issue? That helps me get you sorted quickly.",
    category: "General",
  },
  {
    title: "Password reset steps",
    body: 'You can reset your password from the login page via "Forgot password" — the link stays valid for 60 minutes. If it doesn\'t arrive, check spam and confirm you\'re using the email on your account.',
    category: "Account",
  },
  {
    title: "Refund started",
    body: "I've started a refund to your original payment method. It typically takes 5–10 business days to appear, and you'll get a confirmation email shortly.",
    category: "Billing",
  },
  {
    title: "Escalating to engineering",
    body: "Thanks for your patience — I've escalated this to our engineering team and flagged it as a priority. I'll follow up here as soon as I have an update.",
    category: "Technical",
  },
  {
    title: "Resolved — anything else?",
    body: "Glad that's sorted! I'll mark this resolved, but reply any time if you need a hand with anything else. Thanks for using Orbit.",
    category: "General",
  },
];

interface GenTicket {
  id: string;
  subject: string;
  body: string;
  channel: string;
  status: string;
  intent: string;
  urgency: Urgency;
  queue: string;
  sentiment: string;
  was_deflected: boolean;
  was_ai_assisted: boolean;
  csat: number | null;
  is_hero: boolean;
  requester_id: string | null;
  requester_email: string | null;
  priority: string;
  assignee_id: string | null;
  tags: string[];
  sla_due_at: string | null;
  first_response_at: string | null;
  created_at: string;
  resolved_at: string | null;
}

function generateTickets(templates: typeof TICKET_TEMPLATES, count: number): { tickets: GenTicket[]; messages: unknown[]; events: unknown[] } {
  const tickets: GenTicket[] = [];
  const messages: unknown[] = [];
  const events: unknown[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const tpl = pick(templates);
    const sample = pick(tpl.samples);
    const id = randomUUID();

    // Bias creation toward more recent days so the volume chart trends up.
    const dayAgo = Math.floor(Math.pow(Math.random(), 1.5) * DAYS);
    const createdMs = now - dayAgo * 86400_000 - Math.floor(Math.random() * 86400_000);
    const created = new Date(createdMs).toISOString();

    const roll = Math.random();
    let status: string;
    let wasDeflected = false;
    let wasAiAssisted = false;
    let resolvedAt: string | null = null;
    let csat: number | null = null;
    let positive = true;

    const resolveAfter = (minMin: number, maxMin: number): string => {
      const delta = (minMin + Math.random() * (maxMin - minMin)) * 60_000;
      return new Date(Math.min(createdMs + delta, now)).toISOString();
    };

    if (roll < 0.55) {
      status = "deflected";
      wasDeflected = true;
      resolvedAt = resolveAfter(1, 8);
      csat = pick([5, 5, 4, 4, 4, 3]);
    } else if (roll < 0.78) {
      status = "resolved";
      wasAiAssisted = true;
      resolvedAt = resolveAfter(20, 1800);
      csat = pick([5, 5, 4, 4, 3]);
    } else if (roll < 0.9) {
      status = "resolved";
      resolvedAt = resolveAfter(60, 2880);
      csat = pick([5, 4, 4, 3, 2]);
    } else if (roll < 0.96) {
      status = "assisted";
      wasAiAssisted = true;
      positive = false;
    } else {
      status = "open";
      positive = false;
    }

    const sentiment = pick(positive ? SENTIMENTS_POSITIVE : SENTIMENTS_NEGATIVE);
    const urgency = pick(tpl.urgency);

    tickets.push({
      id,
      subject: sample.subject,
      body: sample.body,
      channel: pick(["chat", "chat", "email", "web"]),
      status,
      intent: tpl.intent,
      urgency,
      queue: tpl.queue,
      sentiment,
      was_deflected: wasDeflected,
      was_ai_assisted: wasAiAssisted,
      csat,
      is_hero: false,
      requester_id: null,
      requester_email: null,
      priority: "normal",
      assignee_id: null,
      tags: [],
      sla_due_at: null,
      first_response_at: null,
      created_at: created,
      resolved_at: resolvedAt,
    });

    // Customer opening message.
    messages.push({ id: randomUUID(), ticket_id: id, role: "customer", body: sample.body, created_at: created });

    // A reply for anything that got handled.
    if (status === "deflected") {
      messages.push({
        id: randomUUID(),
        ticket_id: id,
        role: "ai",
        body: "Here are the steps that resolve this — let me know if anything is unclear.",
        created_at: resolvedAt!,
      });
      events.push({ id: randomUUID(), type: "deflection", ticket_id: id, meta: { intent: tpl.intent }, created_at: created });
    } else if (status === "resolved") {
      messages.push({
        id: randomUUID(),
        ticket_id: id,
        role: wasAiAssisted ? "ai" : "agent",
        body: "Thanks for your patience — I've taken care of this. Reach out if you need anything else.",
        created_at: resolvedAt!,
      });
      events.push({ id: randomUUID(), type: "escalation", ticket_id: id, meta: { intent: tpl.intent }, created_at: created });
      events.push({ id: randomUUID(), type: "resolution", ticket_id: id, meta: { ai_assisted: wasAiAssisted, csat }, created_at: resolvedAt! });
    } else if (status === "assisted") {
      events.push({ id: randomUUID(), type: "escalation", ticket_id: id, meta: { intent: tpl.intent }, created_at: created });
    }
  }

  return { tickets, messages, events };
}

// Case-management enrichment shared by both orgs: priority, tags, SLA, first
// response time, and a chunk of open work assigned to the org's demo agent.
function enrichTickets(tickets: GenTicket[], agentId: string | null): void {
  const tagFor = (intent: string) => intent.split(/[ /&]+/)[0].toLowerCase();
  const slaHours = (p: string) => (p === "urgent" ? 2 : p === "high" ? 8 : p === "normal" ? 24 : 72);
  for (const t of tickets) {
    if (t.is_hero) continue;
    const pr =
      t.urgency === "high"
        ? pick(["high", "urgent"])
        : t.urgency === "medium"
          ? pick(["normal", "normal", "high"])
          : pick(["low", "normal"]);
    t.priority = pr;
    t.tags = Math.random() < 0.15 ? [tagFor(t.intent), "vip"] : [tagFor(t.intent)];
    t.sla_due_at = new Date(new Date(t.created_at).getTime() + slaHours(pr) * 3600_000).toISOString();
    t.first_response_at = t.status === "open" ? null : t.resolved_at;
    if ((t.status === "open" || t.status === "assisted") && agentId && Math.random() < 0.45) t.assignee_id = agentId;
  }
}

// The deliberately seeded "hero" ticket that travels the whole flywheel in the
// guided tour. Its topic (meeting transcripts) is NOT in the seeded KB, so it
// escalates cleanly and, once resolved, becomes a genuinely useful new article.
function buildHeroTicket(): { ticket: GenTicket; messages: unknown[] } {
  const id = randomUUID();
  const created = new Date(Date.now() - 2 * 3600_000).toISOString();
  const body =
    "We recorded our company all-hands last week and I need a written transcript I can edit and share with people who couldn't attend — not just the video file. Under Recordings I only see video and audio downloads. Is there a way to get a text transcript in Orbit?";
  const ticket: GenTicket = {
    id,
    subject: "Can I get an editable transcript of a recorded meeting?",
    body,
    channel: "chat",
    status: "open",
    intent: "Recording",
    urgency: "medium",
    queue: "Recordings",
    sentiment: "confused",
    was_deflected: false,
    was_ai_assisted: false,
    csat: null,
    is_hero: true,
    requester_id: null,
    requester_email: null,
    priority: "high",
    assignee_id: null,
    tags: ["recording", "transcript"],
    sla_due_at: new Date(Date.now() + 6 * 3600_000).toISOString(),
    first_response_at: null,
    created_at: created,
    resolved_at: null,
  };
  const messages = [{ id: randomUUID(), ticket_id: id, role: "customer", body, created_at: created }];
  return { ticket, messages };
}

// ---------------------------------------------------------------------------
// Customers + accounts (0007) — give tickets a real requester identity so the
// agent console + agentic tools have someone concrete to personalize around.
// ---------------------------------------------------------------------------
type AccountSeed = {
  name: string;
  plan: string;
  mrr: number;
  seats: number;
  status: string;
  health: string;
  since: string;
  domain?: string;
  industry?: string;
  company_size?: string;
  region?: string;
  arr?: number;
  renewal_date?: string;
  owner?: string;
  custom_fields?: Record<string, unknown>;
};
type CustomerSeed = {
  name: string;
  email: string;
  title: string | null;
  company: string;
  phone?: string;
  location?: string;
  timezone?: string;
  locale?: string;
  custom_fields?: Record<string, unknown>;
};
type FieldDefSeed = { entity: string; key: string; label: string; type: string; options?: string[] };

const FIELD_DEFS: FieldDefSeed[] = [
  { entity: "customer", key: "lifecycle_stage", label: "Lifecycle stage", type: "select", options: ["Lead", "Trial", "Active", "Churned"] },
  { entity: "customer", key: "nps", label: "NPS score", type: "number" },
  { entity: "account", key: "segment", label: "Segment", type: "select", options: ["SMB", "Mid-Market", "Enterprise"] },
  { entity: "account", key: "csm_notes", label: "CSM notes", type: "text" },
  { entity: "ticket", key: "affected_feature", label: "Affected feature", type: "select", options: ["Meetings", "Recordings", "Billing", "SSO", "Other"] },
  { entity: "doc", key: "review_status", label: "Review status", type: "select", options: ["Up to date", "Needs review", "Outdated"] },
];

const ORBIT_ACCOUNTS: AccountSeed[] = [
  { name: "Northwind Labs", plan: "Business", mrr: 1200, seats: 40, status: "active", health: "healthy", since: "2023-02-11", domain: "northwindlabs.com", industry: "Software", company_size: "51–200", region: "North America", arr: 14400, renewal_date: "2026-02-11", owner: "Dana Ruiz", custom_fields: { segment: "Mid-Market", csm_notes: "Expansion candidate — evaluating more seats in Q3." } },
  { name: "Acme Corp", plan: "Enterprise", mrr: 4800, seats: 150, status: "active", health: "at_risk", since: "2021-09-03", domain: "acmecorp.com", industry: "Manufacturing", company_size: "1000+", region: "North America", arr: 57600, renewal_date: "2026-09-03", owner: "Dana Ruiz", custom_fields: { segment: "Enterprise", csm_notes: "Two escalations this quarter; new exec sponsor." } },
  { name: "Brightwave", plan: "Pro", mrr: 180, seats: 12, status: "active", health: "healthy", since: "2024-06-20", domain: "brightwave.io", industry: "Marketing", company_size: "11–50", region: "EMEA", arr: 2160, renewal_date: "2026-06-20", owner: "Theo Park", custom_fields: { segment: "SMB" } },
  { name: "Lumen Studio", plan: "Pro", mrr: 90, seats: 6, status: "active", health: "healthy", since: "2024-11-02", domain: "lumenstudio.co", industry: "Media", company_size: "1–10", region: "North America", arr: 1080, renewal_date: "2026-11-02", owner: "Theo Park", custom_fields: { segment: "SMB" } },
  { name: "Vertex Health", plan: "Business", mrr: 2100, seats: 65, status: "active", health: "healthy", since: "2022-04-18", domain: "vertexhealth.com", industry: "Healthcare", company_size: "201–500", region: "North America", arr: 25200, renewal_date: "2026-04-18", owner: "Dana Ruiz", custom_fields: { segment: "Mid-Market" } },
  { name: "Independent", plan: "Free", mrr: 0, seats: 1, status: "trial", health: "healthy", since: "2025-12-01", industry: "Other", company_size: "1–10", region: "Global", arr: 0, owner: "—", custom_fields: { segment: "SMB" } },
];
const ORBIT_CUSTOMERS: CustomerSeed[] = [
  { name: "Sarah Chen", email: "sarah.chen@northwindlabs.com", title: "Head of Operations", company: "Northwind Labs", phone: "+1 415 555 0182", location: "San Francisco, US", timezone: "America/Los_Angeles", locale: "en-US", custom_fields: { lifecycle_stage: "Active", nps: 9 } },
  { name: "Tom Becker", email: "tom.becker@northwindlabs.com", title: "Engineering Lead", company: "Northwind Labs", phone: "+1 415 555 0143", location: "San Francisco, US", timezone: "America/Los_Angeles", locale: "en-US", custom_fields: { lifecycle_stage: "Active" } },
  { name: "Marcus Reed", email: "marcus@acmecorp.com", title: "IT Administrator", company: "Acme Corp", phone: "+1 212 555 0199", location: "New York, US", timezone: "America/New_York", locale: "en-US", custom_fields: { lifecycle_stage: "Active", nps: 6 } },
  { name: "Aisha Khan", email: "aisha@acmecorp.com", title: "Recruiting Lead", company: "Acme Corp", phone: "+1 212 555 0167", location: "New York, US", timezone: "America/New_York", locale: "en-US" },
  { name: "Priya Nair", email: "priya.nair@brightwave.io", title: "Office Manager", company: "Brightwave", phone: "+44 20 7946 0321", location: "London, UK", timezone: "Europe/London", locale: "en-GB", custom_fields: { lifecycle_stage: "Active", nps: 10 } },
  { name: "Diego Alvarez", email: "diego@lumenstudio.co", title: "Producer", company: "Lumen Studio", phone: "+1 310 555 0111", location: "Los Angeles, US", timezone: "America/Los_Angeles", locale: "en-US" },
  { name: "Emma Thompson", email: "emma.t@vertexhealth.com", title: "Care Coordinator", company: "Vertex Health", phone: "+1 617 555 0188", location: "Boston, US", timezone: "America/New_York", locale: "en-US", custom_fields: { lifecycle_stage: "Active" } },
  { name: "Jordan Blake", email: "jordan.blake@gmail.com", title: null, company: "Independent", phone: "+1 305 555 0150", location: "Miami, US", timezone: "America/New_York", locale: "en-US", custom_fields: { lifecycle_stage: "Trial", nps: 7 } },
  { name: "Alex Rivera", email: "customer@supportloop.demo", title: "Team Lead", company: "Brightwave", phone: "+44 20 7946 0654", location: "Manchester, UK", timezone: "Europe/London", locale: "en-GB", custom_fields: { lifecycle_stage: "Active" } },
];

const SL_ACCOUNTS: AccountSeed[] = [
  { name: "Meridian Retail", plan: "Business", mrr: 990, seats: 30, status: "active", health: "healthy", since: "2025-01-15", domain: "meridianretail.com", industry: "Retail", company_size: "201–500", region: "North America", arr: 11880, renewal_date: "2026-01-15", owner: "Sofia Marsh", custom_fields: { segment: "Mid-Market" } },
  { name: "Foundry SaaS", plan: "Pro", mrr: 240, seats: 10, status: "active", health: "healthy", since: "2025-03-20", domain: "foundrysaas.com", industry: "Software", company_size: "11–50", region: "EMEA", arr: 2880, renewal_date: "2026-03-20", owner: "Sofia Marsh", custom_fields: { segment: "SMB" } },
  { name: "Cobalt Fintech", plan: "Enterprise", mrr: 3600, seats: 80, status: "active", health: "at_risk", since: "2024-10-05", domain: "cobaltfintech.com", industry: "Financial Services", company_size: "501–1000", region: "North America", arr: 43200, renewal_date: "2026-10-05", owner: "Sofia Marsh", custom_fields: { segment: "Enterprise", csm_notes: "Compliance review in progress." } },
];
const SL_CUSTOMERS: CustomerSeed[] = [
  { name: "Riya Patel", email: "riya@meridianretail.com", title: "CX Manager", company: "Meridian Retail", phone: "+1 312 555 0120", location: "Chicago, US", timezone: "America/Chicago", locale: "en-US", custom_fields: { lifecycle_stage: "Active", nps: 9 } },
  { name: "Ben Carter", email: "ben@meridianretail.com", title: "Support Agent", company: "Meridian Retail", phone: "+1 312 555 0166", location: "Chicago, US", timezone: "America/Chicago", locale: "en-US" },
  { name: "Sam Okonkwo", email: "sam@foundrysaas.com", title: "Support Lead", company: "Foundry SaaS", phone: "+44 161 555 0177", location: "Manchester, UK", timezone: "Europe/London", locale: "en-GB", custom_fields: { lifecycle_stage: "Active" } },
  { name: "Lena Fischer", email: "lena@cobaltfintech.com", title: "Head of Support", company: "Cobalt Fintech", phone: "+49 30 5550 1234", location: "Berlin, DE", timezone: "Europe/Berlin", locale: "de-DE", custom_fields: { lifecycle_stage: "Active", nps: 5 } },
];

/** Seed accounts + customers for an org. Returns email→customerId, or null if
 *  the customer model (migration 0007) isn't applied yet. */
async function seedCustomerModel(
  sb: SupabaseClient,
  orgId: string,
  accounts: AccountSeed[],
  customers: CustomerSeed[]
): Promise<Map<string, string> | null> {
  // Gate on 0008 (custom_field_defs), which implies 0007's customers/accounts.
  const { error: probe } = await sb.from("custom_field_defs").select("id").limit(1);
  if (probe) return null; // customer model + custom fields not applied — seed still runs
  await sb.from("customers").delete().eq("org_id", orgId);
  await sb.from("accounts").delete().eq("org_id", orgId);
  await sb.from("custom_field_defs").delete().eq("org_id", orgId);

  await insertAll(
    sb,
    "custom_field_defs",
    FIELD_DEFS.map((d, i) => ({
      id: randomUUID(),
      org_id: orgId,
      entity: d.entity,
      key: d.key,
      label: d.label,
      type: d.type,
      options: d.options ?? [],
      required: false,
      position: i,
    }))
  );

  const accountRows = accounts.map((a) => ({ id: randomUUID(), org_id: orgId, ...a }));
  await insertAll(sb, "accounts", accountRows);
  const acctIdByName = new Map(accountRows.map((a) => [a.name, a.id]));
  const customerRows = customers.map((c) => {
    const { company, custom_fields, ...rest } = c;
    return { id: randomUUID(), org_id: orgId, account_id: acctIdByName.get(company) ?? null, ...rest, custom_fields: custom_fields ?? {} };
  });
  await insertAll(sb, "customers", customerRows);
  return new Map(customerRows.map((c) => [c.email, c.id]));
}

/** Give each ticket that lacks one a requester email, round-robin across the
 *  roster (so the spread is even and lifetime-ticket counts are believable). */
function assignCustomerEmails(tickets: GenTicket[], customers: CustomerSeed[]): void {
  let i = 0;
  for (const t of tickets) {
    if (t.requester_email) continue;
    t.requester_email = customers[i % customers.length].email;
    i++;
  }
}

const INTAKE_STEPS = [
  { type: "triage" },
  { type: "priority_by_account" },
  { type: "draft_reply" },
  { type: "extract_fields" },
];
const CSAT_STEPS = [
  { type: "escalate" },
  { type: "flag_account_at_risk" },
  { type: "add_internal_note", message: "Low CSAT — reach out personally and offer to make it right." },
];

/** Seed the default workflows. Best-effort: needs 0009; the conditional
 *  csat.submitted workflow needs 0010 (the condition column). */
async function seedWorkflows(sb: SupabaseClient, orgId: string): Promise<void> {
  const { error } = await sb.from("workflows").select("id").limit(1);
  if (error) return; // 0009 not applied
  const { error: condErr } = await sb.from("workflows").select("condition").limit(1);
  const hasCondition = !condErr; // 0010 applied
  await sb.from("workflow_runs").delete().eq("org_id", orgId);
  await sb.from("workflows").delete().eq("org_id", orgId);

  const rows: Record<string, unknown>[] = [
    {
      id: randomUUID(),
      org_id: orgId,
      name: "New ticket intake",
      trigger: "ticket.created",
      enabled: true,
      steps: INTAKE_STEPS,
      position: 0,
      ...(hasCondition ? { condition: {} } : {}),
    },
  ];
  if (hasCondition) {
    rows.push({
      id: randomUUID(),
      org_id: orgId,
      name: "Low-CSAT recovery",
      trigger: "csat.submitted",
      enabled: true,
      steps: CSAT_STEPS,
      position: 1,
      condition: { all: [{ field: "ticket.csat", op: "lte", value: 2 }] },
    });
  }
  await insertAll(sb, "workflows", rows);
}

/**
 * Ensure the three one-click demo accounts exist with the right role + password.
 * Idempotent — safe to run on every seed/reset. Returns role -> user id.
 */
async function ensureDemoAccounts(
  sb: SupabaseClient,
  orgId: string,
  accounts: typeof DEMO_ACCOUNTS
): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  for (const acc of accounts) {
    const existing = list?.users.find((u) => u.email === acc.email);
    if (existing) {
      await sb.auth.admin.updateUserById(existing.id, {
        password: acc.password,
        app_metadata: { role: acc.role, org_id: orgId },
        user_metadata: { display_name: acc.name },
      });
      await sb.from("profiles").upsert({ id: existing.id, role: acc.role, display_name: acc.name, org_id: orgId });
      ids[acc.role] = existing.id;
    } else {
      const { data, error } = await sb.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        app_metadata: { role: acc.role, org_id: orgId },
        user_metadata: { display_name: acc.name },
      });
      if (error || !data.user) throw new Error(`create demo ${acc.email}: ${error?.message ?? "unknown"}`);
      await sb.from("profiles").upsert({ id: data.user.id, role: acc.role, display_name: acc.name, org_id: orgId });
      ids[acc.role] = data.user.id;
    }
  }
  return ids;
}

/**
 * Wipe and reseed all demo data: KB (embedded), ~200 historical tickets + the
 * hero ticket, community Q&A (embedded), and their events. Shared by
 * `npm run seed` and the in-app "Reset demo data" button (api/reset).
 */
export async function seedDatabase(): Promise<Record<string, number>> {
  const sb = supabaseAdmin();

  // Resolve the Orbit (demo) org — created by the tenancy migration. All demo
  // data lives in this org, and the wipe below is scoped to it so real signups
  // and the SupportLoop dogfood org are never touched by a reset.
  const { data: orgRow, error: orgErr } = await sb.from("organizations").select("id").eq("slug", "orbit").maybeSingle();
  if (orgErr) throw new Error(`seed: ${orgErr.message}`);
  if (!orgRow) throw new Error("Orbit org not found — run migration 0004_tenancy.sql first.");
  const orgId = orgRow.id as string;

  // 1. Wipe (children first; eval_runs + kb have no inbound FKs). Scoped to org.
  for (const table of [
    "events",
    "ticket_messages",
    "community_answers",
    "community_questions",
    "eval_runs",
    "canned_responses",
    "tickets",
    "kb_articles",
  ]) {
    const { error } = await sb.from(table).delete().eq("org_id", orgId);
    if (error) throw new Error(`wipe ${table}: ${error.message}`);
  }

  // Demo accounts (idempotent — they persist across resets).
  const demoIds = await ensureDemoAccounts(sb, orgId, DEMO_ACCOUNTS);

  // 2. KB articles + embeddings.
  const kb = kbArticles as KbSeed[];
  const kbEmbeddings = await embed(kb.map((a) => `${a.title}\n\n${a.body}`), "document");
  const nowIso = new Date().toISOString();
  const kbRows = kb.map((a, i) => ({
    id: randomUUID(),
    org_id: orgId,
    title: a.title,
    body: a.body,
    category: a.category,
    tags: a.tags,
    status: "published",
    source: "seed",
    embedding: toVector(kbEmbeddings[i]),
    published_at: nowIso,
  }));
  await insertAll(sb, "kb_articles", kbRows);

  // 3. Customers + accounts, then tickets/messages/events + the hero ticket.
  const emailToCustomerId = await seedCustomerModel(sb, orgId, ORBIT_ACCOUNTS, ORBIT_CUSTOMERS);
  const { tickets, messages, events } = generateTickets(TICKET_TEMPLATES, TARGET_TICKETS);
  const hero = buildHeroTicket();
  hero.ticket.requester_id = demoIds.customer ?? null;
  hero.ticket.requester_email = "customer@supportloop.demo";
  tickets.push(hero.ticket);
  for (const m of hero.messages) messages.push(m);
  assignCustomerEmails(tickets, ORBIT_CUSTOMERS);

  // Case-management enrichment: priority, tags, SLA, first response, assignment.
  const agentId = demoIds.agent ?? null;
  enrichTickets(tickets, agentId);

  await insertAll(
    sb,
    "tickets",
    tickets.map((t) => ({
      ...t,
      org_id: orgId,
      ...(emailToCustomerId
        ? { customer_id: t.requester_email ? emailToCustomerId.get(t.requester_email) ?? null : null }
        : {}),
    }))
  );
  await embedResolvedTickets(sb, orgId, tickets);
  await insertAll(sb, "ticket_messages", messages.map((m) => ({ ...(m as Record<string, unknown>), org_id: orgId })));
  await insertAll(sb, "events", events.map((e) => ({ ...(e as Record<string, unknown>), org_id: orgId })));

  // 4. Community questions + embeddings, plus accepted answers.
  const community = communityData as CommunitySeed[];
  const cqEmbeddings = await embed(community.map((q) => `${q.title}\n\n${q.body}`), "document");
  const cqRows = community.map((q, i) => ({
    id: randomUUID(),
    org_id: orgId,
    title: q.title,
    body: q.body,
    status: q.status,
    has_kb_gap: q.has_kb_gap,
    embedding: toVector(cqEmbeddings[i]),
  }));
  await insertAll(sb, "community_questions", cqRows);

  const answers = community
    .map((q, i) =>
      q.answer
        ? {
            id: randomUUID(),
            org_id: orgId,
            question_id: cqRows[i].id,
            body: q.answer,
            source: q.answer_source ?? "user",
            accepted: true,
            upvotes: Math.floor(Math.random() * 18),
          }
        : null
    )
    .filter((a): a is NonNullable<typeof a> => a !== null);
  if (answers.length) await insertAll(sb, "community_answers", answers);

  // Canned responses (macros).
  const canned = CANNED.map((c) => ({ id: randomUUID(), org_id: orgId, ...c }));
  await insertAll(sb, "canned_responses", canned);

  // Workflows (ticket.created intake automation).
  await seedWorkflows(sb, orgId);

  // Dogfood: seed the SupportLoop org with its own real product data.
  const sl = await seedSupportLoopOrg(sb);

  return {
    kb_articles: kbRows.length,
    tickets: tickets.length,
    ticket_messages: messages.length,
    events: events.length,
    community_questions: cqRows.length,
    community_answers: answers.length,
    demo_accounts: Object.keys(demoIds).length,
    canned_responses: canned.length,
    supportloop_kb: sl.kb_articles,
    supportloop_tickets: sl.tickets,
  };
}

// ---------------------------------------------------------------------------
// Dogfood org — SupportLoop running its own support on SupportLoop. Seeded
// against the separate "supportloop" organization with product-specific data.
// ---------------------------------------------------------------------------
async function seedSupportLoopOrg(sb: SupabaseClient): Promise<{ kb_articles: number; tickets: number }> {
  const { data: org } = await sb.from("organizations").select("id").eq("slug", "supportloop").maybeSingle();
  if (!org) return { kb_articles: 0, tickets: 0 };
  const orgId = org.id as string;

  for (const table of [
    "events",
    "ticket_messages",
    "community_answers",
    "community_questions",
    "eval_runs",
    "canned_responses",
    "tickets",
    "kb_articles",
  ]) {
    const { error } = await sb.from(table).delete().eq("org_id", orgId);
    if (error) throw new Error(`wipe supportloop ${table}: ${error.message}`);
  }

  const ids = await ensureDemoAccounts(sb, orgId, SUPPORTLOOP_ACCOUNTS);
  const agentId = ids.admin ?? null;

  // KB + embeddings.
  const kb = supportloopKb as KbSeed[];
  const kbEmbeddings = await embed(kb.map((a) => `${a.title}\n\n${a.body}`), "document");
  const nowIso = new Date().toISOString();
  const kbRows = kb.map((a, i) => ({
    id: randomUUID(),
    org_id: orgId,
    title: a.title,
    body: a.body,
    category: a.category,
    tags: a.tags,
    status: "published",
    source: "seed",
    embedding: toVector(kbEmbeddings[i]),
    published_at: nowIso,
  }));
  await insertAll(sb, "kb_articles", kbRows);

  // Customers + accounts, then tickets (SupportLoop-specific templates) + enrichment.
  const emailToCustomerId = await seedCustomerModel(sb, orgId, SL_ACCOUNTS, SL_CUSTOMERS);
  const { tickets, messages, events } = generateTickets(SUPPORTLOOP_TEMPLATES, 60);
  assignCustomerEmails(tickets, SL_CUSTOMERS);
  enrichTickets(tickets, agentId);
  await insertAll(
    sb,
    "tickets",
    tickets.map((t) => ({
      ...t,
      org_id: orgId,
      ...(emailToCustomerId
        ? { customer_id: t.requester_email ? emailToCustomerId.get(t.requester_email) ?? null : null }
        : {}),
    }))
  );
  await embedResolvedTickets(sb, orgId, tickets);
  await insertAll(sb, "ticket_messages", messages.map((m) => ({ ...(m as Record<string, unknown>), org_id: orgId })));
  await insertAll(sb, "events", events.map((e) => ({ ...(e as Record<string, unknown>), org_id: orgId })));

  // Community + answers + embeddings.
  const community = supportloopCommunity as CommunitySeed[];
  const cqEmbeddings = await embed(community.map((q) => `${q.title}\n\n${q.body}`), "document");
  const cqRows = community.map((q, i) => ({
    id: randomUUID(),
    org_id: orgId,
    title: q.title,
    body: q.body,
    status: q.status,
    has_kb_gap: q.has_kb_gap,
    embedding: toVector(cqEmbeddings[i]),
  }));
  await insertAll(sb, "community_questions", cqRows);
  const answers = community
    .map((q, i) =>
      q.answer
        ? {
            id: randomUUID(),
            org_id: orgId,
            question_id: cqRows[i].id,
            body: q.answer,
            source: q.answer_source ?? "user",
            accepted: true,
            upvotes: Math.floor(Math.random() * 12),
          }
        : null
    )
    .filter((a): a is NonNullable<typeof a> => a !== null);
  if (answers.length) await insertAll(sb, "community_answers", answers);

  // Canned macros (reuse the generic set).
  const canned = CANNED.map((c) => ({ id: randomUUID(), org_id: orgId, ...c }));
  await insertAll(sb, "canned_responses", canned);

  await seedWorkflows(sb, orgId);

  return { kb_articles: kbRows.length, tickets: tickets.length };
}
