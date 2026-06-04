import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabase";
import { embed, toVector } from "./embeddings";
import type { Urgency } from "./types";
import kbArticles from "../supabase/seed/kb-articles.json";
import communityData from "../supabase/seed/community.json";

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

const SENTIMENTS_POSITIVE = ["satisfied", "neutral", "neutral", "satisfied"];
const SENTIMENTS_NEGATIVE = ["frustrated", "urgent", "confused", "frustrated"];

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
  created_at: string;
  resolved_at: string | null;
}

function generateTickets(): { tickets: GenTicket[]; messages: unknown[]; events: unknown[] } {
  const tickets: GenTicket[] = [];
  const messages: unknown[] = [];
  const events: unknown[] = [];
  const now = Date.now();

  for (let i = 0; i < TARGET_TICKETS; i++) {
    const tpl = pick(TICKET_TEMPLATES);
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
    created_at: created,
    resolved_at: null,
  };
  const messages = [{ id: randomUUID(), ticket_id: id, role: "customer", body, created_at: created }];
  return { ticket, messages };
}

/**
 * Wipe and reseed all demo data: KB (embedded), ~200 historical tickets + the
 * hero ticket, community Q&A (embedded), and their events. Shared by
 * `npm run seed` and the in-app "Reset demo data" button (api/reset).
 */
export async function seedDatabase(): Promise<Record<string, number>> {
  const sb = supabaseAdmin();

  // 1. Wipe (children first; eval_runs + kb have no inbound FKs).
  for (const table of [
    "events",
    "ticket_messages",
    "community_answers",
    "community_questions",
    "eval_runs",
    "tickets",
    "kb_articles",
  ]) {
    const { error } = await sb.from(table).delete().not("id", "is", null);
    if (error) throw new Error(`wipe ${table}: ${error.message}`);
  }

  // 2. KB articles + embeddings.
  const kb = kbArticles as KbSeed[];
  const kbEmbeddings = await embed(kb.map((a) => `${a.title}\n\n${a.body}`), "document");
  const nowIso = new Date().toISOString();
  const kbRows = kb.map((a, i) => ({
    id: randomUUID(),
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

  // 3. Tickets + messages + events (generated) + the hero ticket.
  const { tickets, messages, events } = generateTickets();
  const hero = buildHeroTicket();
  tickets.push(hero.ticket);
  for (const m of hero.messages) messages.push(m);
  await insertAll(sb, "tickets", tickets);
  await insertAll(sb, "ticket_messages", messages);
  await insertAll(sb, "events", events);

  // 4. Community questions + embeddings, plus accepted answers.
  const community = communityData as CommunitySeed[];
  const cqEmbeddings = await embed(community.map((q) => `${q.title}\n\n${q.body}`), "document");
  const cqRows = community.map((q, i) => ({
    id: randomUUID(),
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

  return {
    kb_articles: kbRows.length,
    tickets: tickets.length,
    ticket_messages: messages.length,
    events: events.length,
    community_questions: cqRows.length,
    community_answers: answers.length,
  };
}
