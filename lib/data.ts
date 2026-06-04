// Server-side data access layer. Used by server components (reads) and route
// handlers (writes). Always uses the service-role client — never import this
// from a client component.
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "./supabase";
import { embed, toVector } from "./embeddings";
import type {
  KbArticle,
  Ticket,
  TicketMessage,
  EventType,
  EvalRun,
  CommunityQuestion,
  CommunityAnswer,
} from "./types";

// ---------------------------------------------------------------------------
// Knowledge base
// ---------------------------------------------------------------------------
export async function getPublishedArticles(): Promise<KbArticle[]> {
  const { data, error } = await supabaseAdmin()
    .from("kb_articles")
    .select("*")
    .eq("status", "published")
    .order("category", { ascending: true })
    .order("title", { ascending: true });
  if (error) throw new Error(`getPublishedArticles: ${error.message}`);
  return (data ?? []) as KbArticle[];
}

export async function getArticle(id: string): Promise<KbArticle | null> {
  const { data, error } = await supabaseAdmin().from("kb_articles").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`getArticle: ${error.message}`);
  return (data as KbArticle) ?? null;
}

// ---------------------------------------------------------------------------
// Tickets
// ---------------------------------------------------------------------------
export async function getInboxTickets(): Promise<Ticket[]> {
  const { data, error } = await supabaseAdmin()
    .from("tickets")
    .select("*")
    .in("status", ["open", "assisted"])
    .order("is_hero", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`getInboxTickets: ${error.message}`);
  return (data ?? []) as Ticket[];
}

export async function getTicket(id: string): Promise<Ticket | null> {
  const { data, error } = await supabaseAdmin().from("tickets").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`getTicket: ${error.message}`);
  return (data as Ticket) ?? null;
}

export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const { data, error } = await supabaseAdmin()
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`getTicketMessages: ${error.message}`);
  return (data ?? []) as TicketMessage[];
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------
export async function logEvent(
  type: EventType,
  ticketId: string | null,
  meta: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await supabaseAdmin().from("events").insert({ type, ticket_id: ticketId, meta });
  if (error) throw new Error(`logEvent: ${error.message}`);
}

/** Escalation path from the customer chatbot: create an open ticket. */
export async function createTicketFromChat(message: string, subject?: string): Promise<string> {
  const id = randomUUID();
  const subj = subject?.trim() || (message.trim().length > 80 ? message.trim().slice(0, 80) + "…" : message.trim());
  const { error } = await supabaseAdmin().from("tickets").insert({
    id,
    subject: subj,
    body: message,
    channel: "chat",
    status: "open",
    urgency: "medium",
    queue: "Unassigned",
    was_deflected: false,
    was_ai_assisted: false,
  });
  if (error) throw new Error(`createTicketFromChat: ${error.message}`);
  await supabaseAdmin().from("ticket_messages").insert({ ticket_id: id, role: "customer", body: message });
  await logEvent("escalation", id, { source: "chat" });
  return id;
}

export interface Triage {
  intent: string;
  urgency: string;
  queue: string;
  sentiment: string;
}

export async function saveTriage(ticketId: string, t: Triage): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("tickets")
    .update({ intent: t.intent, urgency: t.urgency, queue: t.queue, sentiment: t.sentiment })
    .eq("id", ticketId);
  if (error) throw new Error(`saveTriage: ${error.message}`);
}

export async function appendAgentReply(ticketId: string, body: string): Promise<void> {
  const { error: msgErr } = await supabaseAdmin()
    .from("ticket_messages")
    .insert({ ticket_id: ticketId, role: "agent", body });
  if (msgErr) throw new Error(`appendAgentReply: ${msgErr.message}`);
  const { error } = await supabaseAdmin()
    .from("tickets")
    .update({ was_ai_assisted: true, status: "assisted" })
    .eq("id", ticketId);
  if (error) throw new Error(`appendAgentReply(update): ${error.message}`);
}

export async function resolveTicket(ticketId: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("tickets")
    .update({ status: "resolved", was_ai_assisted: true, resolved_at: new Date().toISOString() })
    .eq("id", ticketId);
  if (error) throw new Error(`resolveTicket: ${error.message}`);
  await logEvent("resolution", ticketId, { ai_assisted: true });
}

// ---------------------------------------------------------------------------
// Knowledge Loop
// ---------------------------------------------------------------------------
export async function getResolvedTickets(limit = 12): Promise<Ticket[]> {
  const { data, error } = await supabaseAdmin()
    .from("tickets")
    .select("*")
    .eq("status", "resolved")
    .order("resolved_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getResolvedTickets: ${error.message}`);
  return (data ?? []) as Ticket[];
}

export async function getDraftArticles(): Promise<KbArticle[]> {
  const { data, error } = await supabaseAdmin()
    .from("kb_articles")
    .select("*")
    .eq("status", "draft")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getDraftArticles: ${error.message}`);
  return (data ?? []) as KbArticle[];
}

export interface DraftInput {
  title: string;
  body: string;
  category: string;
  tags: string[];
}

export async function createDraftFromTicket(ticketId: string, draft: DraftInput): Promise<string> {
  const id = randomUUID();
  const { error } = await supabaseAdmin().from("kb_articles").insert({
    id,
    title: draft.title,
    body: draft.body,
    category: draft.category,
    tags: draft.tags,
    status: "draft",
    source: "ticket",
    created_from_ticket_id: ticketId,
  });
  if (error) throw new Error(`createDraftFromTicket: ${error.message}`);
  return id;
}

/** Publish a draft: embed it, flip to published, log the event. Closes the loop. */
export async function publishArticle(articleId: string): Promise<void> {
  const article = await getArticle(articleId);
  if (!article) throw new Error("Article not found");
  const [embedding] = await embed([`${article.title}\n\n${article.body}`], "document");
  const { error } = await supabaseAdmin()
    .from("kb_articles")
    .update({ status: "published", published_at: new Date().toISOString(), embedding: toVector(embedding) })
    .eq("id", articleId);
  if (error) throw new Error(`publishArticle: ${error.message}`);
  await logEvent("kb_publish", null, {
    article_id: articleId,
    title: article.title,
    from_ticket: article.created_from_ticket_id,
  });
}

// ---------------------------------------------------------------------------
// Ops dashboard
// ---------------------------------------------------------------------------
export interface MetricSet {
  total: number;
  deflectionRate: number;
  automationRate: number;
  avgCsat: number | null;
}
export interface DashboardData {
  all: MetricSet;
  today: MetricSet;
  volume: { day: string; tickets: number }[];
  topIntents: { name: string; count: number; pct: number }[];
  kbFromTickets: number;
}

interface MetricRow {
  status: string;
  was_deflected: boolean;
  was_ai_assisted: boolean;
  csat: number | null;
  intent: string | null;
  created_at: string;
}

function summarize(rows: MetricRow[]): MetricSet {
  const total = rows.length;
  const deflected = rows.filter((r) => r.was_deflected || r.status === "deflected").length;
  const ai = rows.filter((r) => r.was_ai_assisted).length;
  const csats = rows.map((r) => r.csat).filter((c): c is number => typeof c === "number");
  return {
    total,
    deflectionRate: total ? deflected / total : 0,
    automationRate: total ? ai / total : 0,
    avgCsat: csats.length ? csats.reduce((a, b) => a + b, 0) / csats.length : null,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const { data, error } = await supabaseAdmin()
    .from("tickets")
    .select("status,was_deflected,was_ai_assisted,csat,intent,created_at");
  if (error) throw new Error(`getDashboardData: ${error.message}`);
  const rows = (data ?? []) as MetricRow[];

  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);

  const volume: { day: string; tickets: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    const count = rows.filter((r) => {
      const t = new Date(r.created_at);
      return t >= start && t < end;
    }).length;
    volume.push({ day: `${start.getMonth() + 1}/${start.getDate()}`, tickets: count });
  }

  const intentCounts = new Map<string, number>();
  for (const r of rows) if (r.intent) intentCounts.set(r.intent, (intentCounts.get(r.intent) ?? 0) + 1);
  const topIntents = [...intentCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count, pct: rows.length ? Math.round((count / rows.length) * 100) : 0 }));

  const { count: kbFromTickets } = await supabaseAdmin()
    .from("kb_articles")
    .select("*", { count: "exact", head: true })
    .eq("source", "ticket")
    .eq("status", "published");

  return {
    all: summarize(rows),
    today: summarize(rows.filter((r) => new Date(r.created_at) >= midnight)),
    volume,
    topIntents,
    kbFromTickets: kbFromTickets ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Evals
// ---------------------------------------------------------------------------
export interface EvalResultRow {
  question: string;
  expected: string;
  grounded: boolean;
  pass: boolean;
  similarity: number;
}

export async function insertEvalRun(summary: {
  total: number;
  grounded: number;
  passed: number;
  avg_similarity: number;
  results: EvalResultRow[];
}): Promise<void> {
  const { error } = await supabaseAdmin().from("eval_runs").insert({
    total: summary.total,
    grounded: summary.grounded,
    passed: summary.passed,
    avg_similarity: summary.avg_similarity,
    meta: { results: summary.results },
  });
  if (error) throw new Error(`insertEvalRun: ${error.message}`);
}

export async function getLatestEvalRun(): Promise<EvalRun | null> {
  const { data, error } = await supabaseAdmin()
    .from("eval_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getLatestEvalRun: ${error.message}`);
  return (data as EvalRun) ?? null;
}

// ---------------------------------------------------------------------------
// Community Q&A
// ---------------------------------------------------------------------------
export type CommunityQuestionWithCount = CommunityQuestion & { answerCount: number };

export async function getCommunityQuestions(): Promise<CommunityQuestionWithCount[]> {
  const { data: qs, error } = await supabaseAdmin()
    .from("community_questions")
    .select("*")
    .order("has_kb_gap", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getCommunityQuestions: ${error.message}`);
  const { data: ans } = await supabaseAdmin().from("community_answers").select("question_id");
  const counts = new Map<string, number>();
  for (const a of ans ?? []) counts.set(a.question_id, (counts.get(a.question_id) ?? 0) + 1);
  return (qs ?? []).map((q) => ({ ...(q as CommunityQuestion), answerCount: counts.get(q.id) ?? 0 }));
}

export async function getCommunityQuestion(id: string): Promise<CommunityQuestion | null> {
  const { data, error } = await supabaseAdmin().from("community_questions").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`getCommunityQuestion: ${error.message}`);
  return (data as CommunityQuestion) ?? null;
}

export async function getCommunityAnswers(questionId: string): Promise<CommunityAnswer[]> {
  const { data, error } = await supabaseAdmin()
    .from("community_answers")
    .select("*")
    .eq("question_id", questionId)
    .order("accepted", { ascending: false })
    .order("upvotes", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`getCommunityAnswers: ${error.message}`);
  return (data ?? []) as CommunityAnswer[];
}

export async function createAiAnswer(questionId: string, body: string): Promise<string> {
  const id = randomUUID();
  const { error } = await supabaseAdmin()
    .from("community_answers")
    .insert({ id, question_id: questionId, body, source: "ai", accepted: false, upvotes: 0 });
  if (error) throw new Error(`createAiAnswer: ${error.message}`);
  return id;
}

export async function acceptAnswer(answerId: string): Promise<void> {
  const { data: ans, error: getErr } = await supabaseAdmin()
    .from("community_answers")
    .select("question_id")
    .eq("id", answerId)
    .maybeSingle();
  if (getErr) throw new Error(`acceptAnswer(get): ${getErr.message}`);
  if (!ans) throw new Error("Answer not found");
  const { error } = await supabaseAdmin().from("community_answers").update({ accepted: true }).eq("id", answerId);
  if (error) throw new Error(`acceptAnswer: ${error.message}`);
  await supabaseAdmin().from("community_questions").update({ status: "answered" }).eq("id", ans.question_id);
  await logEvent("community_answer", null, { question_id: ans.question_id, answer_id: answerId });
}

export async function upvoteAnswer(answerId: string): Promise<number> {
  const { data: ans, error: getErr } = await supabaseAdmin()
    .from("community_answers")
    .select("upvotes")
    .eq("id", answerId)
    .maybeSingle();
  if (getErr) throw new Error(`upvoteAnswer(get): ${getErr.message}`);
  if (!ans) throw new Error("Answer not found");
  const next = (ans.upvotes ?? 0) + 1;
  const { error } = await supabaseAdmin().from("community_answers").update({ upvotes: next }).eq("id", answerId);
  if (error) throw new Error(`upvoteAnswer: ${error.message}`);
  return next;
}

/** Weak retrieval → flag the gap and seed a draft stub in the Knowledge Loop. */
export async function flagKnowledgeGap(questionId: string): Promise<string> {
  const q = await getCommunityQuestion(questionId);
  if (!q) throw new Error("Question not found");
  await supabaseAdmin().from("community_questions").update({ has_kb_gap: true }).eq("id", questionId);
  await logEvent("gap_flagged", null, { question_id: questionId, title: q.title });

  const id = randomUUID();
  const { error } = await supabaseAdmin().from("kb_articles").insert({
    id,
    title: q.title,
    body: `Draft stub from a community knowledge gap. Write the answer here.\n\nQuestion asked:\n${q.body}`,
    category: "General",
    tags: ["community-gap"],
    status: "draft",
    source: "community",
    created_from_question_id: questionId,
  });
  if (error) throw new Error(`flagKnowledgeGap(draft): ${error.message}`);
  return id;
}
