// Server-side data access layer. Used by server components (reads) and route
// handlers (writes). Always uses the service-role client — never import this
// from a client component. Every query is scoped to an org (the first argument)
// — that is the tenant-isolation boundary, since the service role bypasses RLS.
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "./supabase";
import { embed, embedOne, toVector } from "./embeddings";
import { matchTickets, type TicketMatch } from "./retrieve";
import type {
  KbArticle,
  Ticket,
  TicketMessage,
  EventType,
  EvalRun,
  CommunityQuestion,
  CommunityAnswer,
  Profile,
  CannedResponse,
} from "./types";

// ---------------------------------------------------------------------------
// Knowledge base
// ---------------------------------------------------------------------------
export async function getPublishedArticles(orgId: string): Promise<KbArticle[]> {
  const { data, error } = await supabaseAdmin()
    .from("kb_articles")
    .select("*")
    .eq("org_id", orgId)
    .eq("status", "published")
    .order("category", { ascending: true })
    .order("title", { ascending: true });
  if (error) throw new Error(`getPublishedArticles: ${error.message}`);
  return (data ?? []) as KbArticle[];
}

export async function getArticle(orgId: string, id: string): Promise<KbArticle | null> {
  const { data, error } = await supabaseAdmin()
    .from("kb_articles")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();
  if (error) throw new Error(`getArticle: ${error.message}`);
  return (data as KbArticle) ?? null;
}

// ---------------------------------------------------------------------------
// Tickets
// ---------------------------------------------------------------------------
export async function getTicket(orgId: string, id: string): Promise<Ticket | null> {
  const { data, error } = await supabaseAdmin()
    .from("tickets")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();
  if (error) throw new Error(`getTicket: ${error.message}`);
  return (data as Ticket) ?? null;
}

export async function getTicketMessages(orgId: string, ticketId: string): Promise<TicketMessage[]> {
  const { data, error } = await supabaseAdmin()
    .from("ticket_messages")
    .select("*")
    .eq("org_id", orgId)
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`getTicketMessages: ${error.message}`);
  return (data ?? []) as TicketMessage[];
}

/** Tickets opened by a given customer (for "My Tickets"). */
export async function getMyTickets(orgId: string, userId: string): Promise<Ticket[]> {
  const { data, error } = await supabaseAdmin()
    .from("tickets")
    .select("*")
    .eq("org_id", orgId)
    .eq("requester_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getMyTickets: ${error.message}`);
  return (data ?? []) as Ticket[];
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------
export async function logEvent(
  orgId: string,
  type: EventType,
  ticketId: string | null,
  meta: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await supabaseAdmin().from("events").insert({ org_id: orgId, type, ticket_id: ticketId, meta });
  if (error) throw new Error(`logEvent: ${error.message}`);
}

/** Escalation path from the chatbot or the "Submit a request" web form. */
export async function createTicketFromChat(
  orgId: string,
  message: string,
  subject?: string,
  requesterId?: string | null,
  requesterEmail?: string | null,
  channel: string = "chat"
): Promise<string> {
  const id = randomUUID();
  const subj = subject?.trim() || (message.trim().length > 80 ? message.trim().slice(0, 80) + "…" : message.trim());
  const { error } = await supabaseAdmin().from("tickets").insert({
    id,
    org_id: orgId,
    subject: subj,
    body: message,
    channel,
    status: "open",
    urgency: "medium",
    queue: "Unassigned",
    was_deflected: false,
    was_ai_assisted: false,
    requester_id: requesterId ?? null,
    requester_email: requesterEmail ?? null,
  });
  if (error) throw new Error(`createTicketFromChat: ${error.message}`);
  await supabaseAdmin().from("ticket_messages").insert({ org_id: orgId, ticket_id: id, role: "customer", body: message });
  await logEvent(orgId, "escalation", id, { source: "chat" });
  return id;
}

export interface Triage {
  intent: string;
  urgency: string;
  queue: string;
  sentiment: string;
}

export async function saveTriage(orgId: string, ticketId: string, t: Triage): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("tickets")
    .update({ intent: t.intent, urgency: t.urgency, queue: t.queue, sentiment: t.sentiment })
    .eq("id", ticketId)
    .eq("org_id", orgId);
  if (error) throw new Error(`saveTriage: ${error.message}`);
}

export async function appendAgentReply(orgId: string, ticketId: string, body: string, internal = false): Promise<void> {
  const { error: msgErr } = await supabaseAdmin()
    .from("ticket_messages")
    .insert({ org_id: orgId, ticket_id: ticketId, role: "agent", body, internal });
  if (msgErr) throw new Error(`appendAgentReply: ${msgErr.message}`);
  if (internal) return; // internal notes don't change ticket state
  const { data: t } = await supabaseAdmin()
    .from("tickets")
    .select("first_response_at")
    .eq("id", ticketId)
    .eq("org_id", orgId)
    .maybeSingle();
  const patch: Record<string, unknown> = { was_ai_assisted: true, status: "assisted" };
  if (t && !(t as { first_response_at: string | null }).first_response_at) patch.first_response_at = new Date().toISOString();
  const { error } = await supabaseAdmin().from("tickets").update(patch).eq("id", ticketId).eq("org_id", orgId);
  if (error) throw new Error(`appendAgentReply(update): ${error.message}`);
}

export async function resolveTicket(orgId: string, ticketId: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("tickets")
    .update({ status: "resolved", was_ai_assisted: true, resolved_at: new Date().toISOString() })
    .eq("id", ticketId)
    .eq("org_id", orgId);
  if (error) throw new Error(`resolveTicket: ${error.message}`);
  await logEvent(orgId, "resolution", ticketId, { ai_assisted: true });
}

// ---------------------------------------------------------------------------
// Knowledge Loop
// ---------------------------------------------------------------------------
export async function getResolvedTickets(orgId: string, limit = 12): Promise<Ticket[]> {
  const { data, error } = await supabaseAdmin()
    .from("tickets")
    .select("*")
    .eq("org_id", orgId)
    .eq("status", "resolved")
    .order("resolved_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getResolvedTickets: ${error.message}`);
  return (data ?? []) as Ticket[];
}

export async function getDraftArticles(orgId: string): Promise<KbArticle[]> {
  const { data, error } = await supabaseAdmin()
    .from("kb_articles")
    .select("*")
    .eq("org_id", orgId)
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

export async function createDraftFromTicket(orgId: string, ticketId: string, draft: DraftInput): Promise<string> {
  const id = randomUUID();
  const { error } = await supabaseAdmin().from("kb_articles").insert({
    id,
    org_id: orgId,
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
export async function publishArticle(orgId: string, articleId: string): Promise<void> {
  const article = await getArticle(orgId, articleId);
  if (!article) throw new Error("Article not found");
  const [embedding] = await embed([`${article.title}\n\n${article.body}`], "document");
  const { error } = await supabaseAdmin()
    .from("kb_articles")
    .update({ status: "published", published_at: new Date().toISOString(), embedding: toVector(embedding) })
    .eq("id", articleId)
    .eq("org_id", orgId);
  if (error) throw new Error(`publishArticle: ${error.message}`);
  await logEvent(orgId, "kb_publish", null, {
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

export async function getDashboardData(orgId: string): Promise<DashboardData> {
  const { data, error } = await supabaseAdmin()
    .from("tickets")
    .select("status,was_deflected,was_ai_assisted,csat,intent,created_at")
    .eq("org_id", orgId);
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
    .eq("org_id", orgId)
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

export async function insertEvalRun(
  orgId: string,
  summary: { total: number; grounded: number; passed: number; avg_similarity: number; results: EvalResultRow[] }
): Promise<void> {
  const { error } = await supabaseAdmin().from("eval_runs").insert({
    org_id: orgId,
    total: summary.total,
    grounded: summary.grounded,
    passed: summary.passed,
    avg_similarity: summary.avg_similarity,
    meta: { results: summary.results },
  });
  if (error) throw new Error(`insertEvalRun: ${error.message}`);
}

export async function getLatestEvalRun(orgId: string): Promise<EvalRun | null> {
  const { data, error } = await supabaseAdmin()
    .from("eval_runs")
    .select("*")
    .eq("org_id", orgId)
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

export async function getCommunityQuestions(orgId: string): Promise<CommunityQuestionWithCount[]> {
  const { data: qs, error } = await supabaseAdmin()
    .from("community_questions")
    .select("*")
    .eq("org_id", orgId)
    .order("has_kb_gap", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getCommunityQuestions: ${error.message}`);
  const { data: ans } = await supabaseAdmin().from("community_answers").select("question_id").eq("org_id", orgId);
  const counts = new Map<string, number>();
  for (const a of ans ?? []) counts.set(a.question_id, (counts.get(a.question_id) ?? 0) + 1);
  return (qs ?? []).map((q) => ({ ...(q as CommunityQuestion), answerCount: counts.get(q.id) ?? 0 }));
}

export async function getCommunityQuestion(orgId: string, id: string): Promise<CommunityQuestion | null> {
  const { data, error } = await supabaseAdmin()
    .from("community_questions")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();
  if (error) throw new Error(`getCommunityQuestion: ${error.message}`);
  return (data as CommunityQuestion) ?? null;
}

export async function getCommunityAnswers(orgId: string, questionId: string): Promise<CommunityAnswer[]> {
  const { data, error } = await supabaseAdmin()
    .from("community_answers")
    .select("*")
    .eq("org_id", orgId)
    .eq("question_id", questionId)
    .order("accepted", { ascending: false })
    .order("upvotes", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`getCommunityAnswers: ${error.message}`);
  return (data ?? []) as CommunityAnswer[];
}

/** A customer posts a question to the community. */
export async function createCommunityQuestion(orgId: string, title: string, body: string): Promise<string> {
  const id = randomUUID();
  const [embedding] = await embed([`${title}\n\n${body}`], "document");
  const { error } = await supabaseAdmin().from("community_questions").insert({
    id,
    org_id: orgId,
    title,
    body,
    status: "open",
    has_kb_gap: false,
    embedding: toVector(embedding),
  });
  if (error) throw new Error(`createCommunityQuestion: ${error.message}`);
  return id;
}

export async function createAiAnswer(orgId: string, questionId: string, body: string): Promise<string> {
  const id = randomUUID();
  const { error } = await supabaseAdmin()
    .from("community_answers")
    .insert({ id, org_id: orgId, question_id: questionId, body, source: "ai", accepted: false, upvotes: 0 });
  if (error) throw new Error(`createAiAnswer: ${error.message}`);
  return id;
}

export async function acceptAnswer(orgId: string, answerId: string): Promise<void> {
  const { data: ans, error: getErr } = await supabaseAdmin()
    .from("community_answers")
    .select("question_id")
    .eq("id", answerId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (getErr) throw new Error(`acceptAnswer(get): ${getErr.message}`);
  if (!ans) throw new Error("Answer not found");
  const { error } = await supabaseAdmin()
    .from("community_answers")
    .update({ accepted: true })
    .eq("id", answerId)
    .eq("org_id", orgId);
  if (error) throw new Error(`acceptAnswer: ${error.message}`);
  await supabaseAdmin().from("community_questions").update({ status: "answered" }).eq("id", ans.question_id).eq("org_id", orgId);
  await logEvent(orgId, "community_answer", null, { question_id: ans.question_id, answer_id: answerId });
}

export async function upvoteAnswer(orgId: string, answerId: string): Promise<number> {
  const { data: ans, error: getErr } = await supabaseAdmin()
    .from("community_answers")
    .select("upvotes")
    .eq("id", answerId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (getErr) throw new Error(`upvoteAnswer(get): ${getErr.message}`);
  if (!ans) throw new Error("Answer not found");
  const next = (ans.upvotes ?? 0) + 1;
  const { error } = await supabaseAdmin()
    .from("community_answers")
    .update({ upvotes: next })
    .eq("id", answerId)
    .eq("org_id", orgId);
  if (error) throw new Error(`upvoteAnswer: ${error.message}`);
  return next;
}

/** Weak retrieval → flag the gap and seed a draft stub in the Knowledge Loop. */
export async function flagKnowledgeGap(orgId: string, questionId: string): Promise<string> {
  const q = await getCommunityQuestion(orgId, questionId);
  if (!q) throw new Error("Question not found");
  await supabaseAdmin().from("community_questions").update({ has_kb_gap: true }).eq("id", questionId).eq("org_id", orgId);
  await logEvent(orgId, "gap_flagged", null, { question_id: questionId, title: q.title });

  const id = randomUUID();
  const { error } = await supabaseAdmin().from("kb_articles").insert({
    id,
    org_id: orgId,
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

// ---------------------------------------------------------------------------
// Case management — queue, properties, agents, macros (V3)
// ---------------------------------------------------------------------------
const OPEN_STATUSES = ["open", "assisted"];

export interface QueueFilters {
  view: string;
  q?: string;
  priority?: string;
}

export async function getQueue(orgId: string, filters: QueueFilters, meId: string): Promise<Ticket[]> {
  let query = supabaseAdmin().from("tickets").select("*").eq("org_id", orgId);
  const v = filters.view;
  if (v === "resolved") query = query.in("status", ["resolved", "deflected"]);
  else if (v !== "all") query = query.in("status", OPEN_STATUSES);
  if (v === "my-open") query = query.eq("assignee_id", meId);
  if (v === "unassigned") query = query.is("assignee_id", null);
  if (v === "urgent") query = query.in("priority", ["high", "urgent"]);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.q) query = query.ilike("subject", `%${filters.q}%`);
  query = query.order("is_hero", { ascending: false }).order("created_at", { ascending: false }).limit(100);
  const { data, error } = await query;
  if (error) throw new Error(`getQueue: ${error.message}`);
  return (data ?? []) as Ticket[];
}

export async function getQueueCounts(orgId: string, meId: string): Promise<Record<string, number>> {
  const { data, error } = await supabaseAdmin().from("tickets").select("status,assignee_id,priority").eq("org_id", orgId);
  if (error) throw new Error(`getQueueCounts: ${error.message}`);
  const rows = (data ?? []) as { status: string; assignee_id: string | null; priority: string }[];
  const openish = (r: { status: string }) => r.status === "open" || r.status === "assisted";
  return {
    "my-open": rows.filter((r) => openish(r) && r.assignee_id === meId).length,
    unassigned: rows.filter((r) => openish(r) && !r.assignee_id).length,
    urgent: rows.filter((r) => openish(r) && (r.priority === "high" || r.priority === "urgent")).length,
    open: rows.filter(openish).length,
    resolved: rows.filter((r) => r.status === "resolved" || r.status === "deflected").length,
    all: rows.length,
  };
}

export async function getAgents(orgId: string): Promise<Profile[]> {
  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .select("*")
    .eq("org_id", orgId)
    .in("role", ["agent", "admin"])
    .order("display_name");
  if (error) throw new Error(`getAgents: ${error.message}`);
  return (data ?? []) as Profile[];
}

export type TicketFields = Partial<Pick<Ticket, "priority" | "status" | "assignee_id" | "queue" | "tags">>;

export async function updateTicketFields(orgId: string, id: string, fields: TicketFields): Promise<void> {
  const patch: Record<string, unknown> = { ...fields };
  if (fields.status === "resolved") patch.resolved_at = new Date().toISOString();
  const { error } = await supabaseAdmin().from("tickets").update(patch).eq("id", id).eq("org_id", orgId);
  if (error) throw new Error(`updateTicketFields: ${error.message}`);
  if (fields.status === "resolved") await logEvent(orgId, "resolution", id, { manual: true });
}

export async function getCannedResponses(orgId: string): Promise<CannedResponse[]> {
  const { data, error } = await supabaseAdmin().from("canned_responses").select("*").eq("org_id", orgId).order("title");
  if (error) throw new Error(`getCannedResponses: ${error.message}`);
  return (data ?? []) as CannedResponse[];
}

// ---------------------------------------------------------------------------
// Admin (manage agents + KB)
// ---------------------------------------------------------------------------
export async function getAllProfiles(orgId: string): Promise<Profile[]> {
  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .select("*")
    .eq("org_id", orgId)
    .order("role")
    .order("display_name");
  if (error) throw new Error(`getAllProfiles: ${error.message}`);
  return (data ?? []) as Profile[];
}

export async function setUserRole(orgId: string, userId: string, role: "customer" | "agent" | "admin"): Promise<void> {
  // Only act on a user in this org; preserve org_id in app_metadata.
  const { data: target } = await supabaseAdmin().from("profiles").select("id").eq("id", userId).eq("org_id", orgId).maybeSingle();
  if (!target) throw new Error("User not in this organization");
  await supabaseAdmin().auth.admin.updateUserById(userId, { app_metadata: { role, org_id: orgId } });
  const { error } = await supabaseAdmin().from("profiles").update({ role }).eq("id", userId).eq("org_id", orgId);
  if (error) throw new Error(`setUserRole: ${error.message}`);
}

export async function getAllArticles(orgId: string): Promise<KbArticle[]> {
  const { data, error } = await supabaseAdmin()
    .from("kb_articles")
    .select("*")
    .eq("org_id", orgId)
    .order("status")
    .order("title");
  if (error) throw new Error(`getAllArticles: ${error.message}`);
  return (data ?? []) as KbArticle[];
}

export async function updateArticle(
  orgId: string,
  id: string,
  fields: { title?: string; body?: string; category?: string; tags?: string[] }
): Promise<void> {
  const article = await getArticle(orgId, id);
  if (!article) throw new Error("Article not found");
  const patch: Record<string, unknown> = { ...fields };
  if (article.status === "published" && (fields.title || fields.body)) {
    const [embedding] = await embed([`${fields.title ?? article.title}\n\n${fields.body ?? article.body}`], "document");
    patch.embedding = toVector(embedding);
  }
  const { error } = await supabaseAdmin().from("kb_articles").update(patch).eq("id", id).eq("org_id", orgId);
  if (error) throw new Error(`updateArticle: ${error.message}`);
}

export async function unpublishArticle(orgId: string, id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("kb_articles").update({ status: "draft" }).eq("id", id).eq("org_id", orgId);
  if (error) throw new Error(`unpublishArticle: ${error.message}`);
}

export async function deleteArticle(orgId: string, id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("kb_articles").delete().eq("id", id).eq("org_id", orgId);
  if (error) throw new Error(`deleteArticle: ${error.message}`);
}

/** Bring-your-own-knowledge: embed + publish imported articles into the org KB. */
export async function importArticles(
  orgId: string,
  articles: { title: string; body: string; category?: string; tags?: string[] }[]
): Promise<number> {
  const clean = articles.filter((a) => a.title.trim() && a.body.trim());
  if (!clean.length) return 0;
  const embeddings = await embed(
    clean.map((a) => `${a.title}\n\n${a.body}`),
    "document"
  );
  const nowIso = new Date().toISOString();
  const rows = clean.map((a, i) => ({
    id: randomUUID(),
    org_id: orgId,
    title: a.title.trim(),
    body: a.body.trim(),
    category: a.category?.trim() || "Imported",
    tags: a.tags ?? [],
    status: "published",
    source: "import",
    embedding: toVector(embeddings[i]),
    published_at: nowIso,
  }));
  const { error } = await supabaseAdmin().from("kb_articles").insert(rows);
  if (error) throw new Error(`importArticles: ${error.message}`);
  return rows.length;
}

// ---------------------------------------------------------------------------
// Ops intelligence — emerging themes + week-over-week movement (R2)
// ---------------------------------------------------------------------------
export interface InsightTheme {
  name: string;
  thisWeek: number;
  lastWeek: number;
  trend: "new" | "up" | "down" | "flat";
}
export interface InsightsData {
  themes: InsightTheme[];
  thisWeekTotal: number;
  lastWeekTotal: number;
  resolvedThisWeek: number;
}

/** Cluster the last two weeks of tickets by intent and score the movement. */
export async function getInsightsData(orgId: string): Promise<InsightsData> {
  const since = new Date(Date.now() - 14 * 86400_000).toISOString();
  const { data, error } = await supabaseAdmin()
    .from("tickets")
    .select("intent,status,created_at")
    .eq("org_id", orgId)
    .gte("created_at", since);
  if (error) throw new Error(`getInsightsData: ${error.message}`);
  const rows = (data ?? []) as { intent: string | null; status: string; created_at: string }[];

  const weekAgo = Date.now() - 7 * 86400_000;
  const counts = new Map<string, { thisWeek: number; lastWeek: number }>();
  let thisWeekTotal = 0;
  let lastWeekTotal = 0;
  let resolvedThisWeek = 0;
  for (const r of rows) {
    const recent = new Date(r.created_at).getTime() >= weekAgo;
    const name = r.intent || "Untriaged";
    const c = counts.get(name) ?? { thisWeek: 0, lastWeek: 0 };
    if (recent) {
      c.thisWeek++;
      thisWeekTotal++;
      if (r.status === "resolved" || r.status === "deflected") resolvedThisWeek++;
    } else {
      c.lastWeek++;
      lastWeekTotal++;
    }
    counts.set(name, c);
  }

  const themes: InsightTheme[] = [...counts.entries()]
    .map(([name, c]) => {
      let trend: InsightTheme["trend"] = "flat";
      if (c.lastWeek === 0 && c.thisWeek > 0) trend = "new";
      else if (c.thisWeek > c.lastWeek * 1.15) trend = "up";
      else if (c.thisWeek < c.lastWeek * 0.85) trend = "down";
      return { name, thisWeek: c.thisWeek, lastWeek: c.lastWeek, trend };
    })
    .filter((t) => t.thisWeek > 0 || t.lastWeek > 0)
    .sort((a, b) => b.thisWeek - a.thisWeek)
    .slice(0, 6);

  return { themes, thisWeekTotal, lastWeekTotal, resolvedThisWeek };
}

// ---------------------------------------------------------------------------
// Agent copilot — semantically similar past tickets (R3)
// ---------------------------------------------------------------------------
/**
 * Resolved tickets similar to this one. Tries semantic search (requires the
 * 0005 migration + ticket embeddings); falls back to same-intent resolved
 * tickets so the feature works even before the migration + reseed.
 */
export async function getSimilarTickets(orgId: string, ticketId: string): Promise<TicketMatch[]> {
  const t = await getTicket(orgId, ticketId);
  if (!t) return [];
  try {
    const emb = await embedOne(`${t.subject}\n\n${t.body}`, "query");
    const hits = await matchTickets(emb, orgId, ticketId, 3, 0.5);
    if (hits.length) return hits;
  } catch {
    /* embeddings / match_tickets not available yet — fall through */
  }
  if (!t.intent) return [];
  const { data } = await supabaseAdmin()
    .from("tickets")
    .select("id,subject,body,intent,status")
    .eq("org_id", orgId)
    .neq("id", ticketId)
    .in("status", ["resolved", "deflected"])
    .eq("intent", t.intent)
    .order("resolved_at", { ascending: false })
    .limit(3);
  return ((data ?? []) as { id: string; subject: string; body: string; intent: string | null; status: string }[]).map(
    (r) => ({ ...r, similarity: 0 })
  );
}

/** A customer rates a resolved ticket (1–5). Scoped to their own ticket. */
export async function setTicketCsat(
  orgId: string,
  ticketId: string,
  requesterId: string,
  score: number
): Promise<void> {
  const s = Math.max(1, Math.min(5, Math.round(score)));
  const { error } = await supabaseAdmin()
    .from("tickets")
    .update({ csat: s })
    .eq("id", ticketId)
    .eq("org_id", orgId)
    .eq("requester_id", requesterId);
  if (error) throw new Error(`setTicketCsat: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Live chat (R5)
// ---------------------------------------------------------------------------
/** Open a live-chat ticket (channel "live"); the realtime room keys off its id. */
export async function createLiveTicket(
  orgId: string,
  requesterId?: string | null,
  requesterEmail?: string | null
): Promise<string> {
  const id = randomUUID();
  const { error } = await supabaseAdmin().from("tickets").insert({
    id,
    org_id: orgId,
    subject: "Live chat",
    body: "Customer started a live chat.",
    channel: "live",
    status: "open",
    urgency: "medium",
    queue: "Unassigned",
    was_deflected: false,
    was_ai_assisted: false,
    requester_id: requesterId ?? null,
    requester_email: requesterEmail ?? null,
  });
  if (error) throw new Error(`createLiveTicket: ${error.message}`);
  await logEvent(orgId, "escalation", id, { source: "live" });
  return id;
}

/** Persist a live-chat message (history alongside the realtime broadcast). */
export async function appendLiveMessage(
  orgId: string,
  ticketId: string,
  role: "customer" | "agent",
  body: string
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("ticket_messages")
    .insert({ org_id: orgId, ticket_id: ticketId, role, body });
  if (error) throw new Error(`appendLiveMessage: ${error.message}`);
  if (role === "agent") {
    await supabaseAdmin().from("tickets").update({ status: "assisted" }).eq("id", ticketId).eq("org_id", orgId);
  }
}

// ---------------------------------------------------------------------------
// AI observability — trace every model call (latency, tokens, $, grounding)
// ---------------------------------------------------------------------------
const AI_PRICING: Record<string, { in: number; out: number }> = {
  // Illustrative $/M-token rates.
  "claude-sonnet-4-6": { in: 3, out: 15 },
  "claude-haiku-4-5-20251001": { in: 1, out: 5 },
};
function aiCost(model: string, inTok: number, outTok: number): number {
  const p = AI_PRICING[model] ?? { in: 1, out: 5 };
  return (inTok * p.in + outTok * p.out) / 1_000_000;
}

export interface AiTrace {
  surface: string;
  model: string;
  latencyMs: number;
  inputTokens?: number | null;
  outputTokens?: number | null;
  grounded?: boolean | null;
  topSimilarity?: number | null;
  ticketId?: string | null;
}

/** Best-effort: record one AI interaction for the observability view. */
export async function logAiTrace(orgId: string, t: AiTrace): Promise<void> {
  const costUsd =
    t.inputTokens != null && t.outputTokens != null ? aiCost(t.model, t.inputTokens, t.outputTokens) : null;
  try {
    await supabaseAdmin().from("events").insert({
      org_id: orgId,
      type: "ai_trace",
      ticket_id: t.ticketId ?? null,
      meta: {
        surface: t.surface,
        model: t.model,
        latencyMs: t.latencyMs,
        inputTokens: t.inputTokens ?? null,
        outputTokens: t.outputTokens ?? null,
        costUsd,
        grounded: t.grounded ?? null,
        topSimilarity: t.topSimilarity ?? null,
      },
    });
  } catch {
    /* tracing must never break the AI flow */
  }
}

export interface AiActivityRow {
  surface: string;
  model: string;
  latencyMs: number;
  costUsd: number | null;
  grounded: boolean | null;
  topSimilarity: number | null;
  created_at: string;
}
export interface AiActivity {
  rows: AiActivityRow[];
  totalCalls: number;
  totalCost: number;
  avgLatency: number;
  groundedRate: number | null;
}

export async function getAiActivity(orgId: string, limit = 60): Promise<AiActivity> {
  const { data } = await supabaseAdmin()
    .from("events")
    .select("meta,created_at")
    .eq("org_id", orgId)
    .eq("type", "ai_trace")
    .order("created_at", { ascending: false })
    .limit(300);
  const rows: AiActivityRow[] = (data ?? []).map((e) => {
    const meta = (e.meta ?? {}) as Record<string, unknown>;
    return {
      surface: String(meta.surface ?? "—"),
      model: String(meta.model ?? "—"),
      latencyMs: Number(meta.latencyMs ?? 0),
      costUsd: meta.costUsd == null ? null : Number(meta.costUsd),
      grounded: meta.grounded == null ? null : Boolean(meta.grounded),
      topSimilarity: meta.topSimilarity == null ? null : Number(meta.topSimilarity),
      created_at: e.created_at as string,
    };
  });
  const totalCalls = rows.length;
  const totalCost = rows.reduce((s, r) => s + (r.costUsd ?? 0), 0);
  const avgLatency = totalCalls ? rows.reduce((s, r) => s + r.latencyMs, 0) / totalCalls : 0;
  const grounding = rows.filter((r) => r.grounded != null);
  const groundedRate = grounding.length ? grounding.filter((r) => r.grounded).length / grounding.length : null;
  return { rows: rows.slice(0, limit), totalCalls, totalCost, avgLatency, groundedRate };
}

// ---------------------------------------------------------------------------
// Customer + account context (0007) — for personalization
// ---------------------------------------------------------------------------
export interface CustomerContext {
  customer: { id: string; name: string; email: string; title: string | null };
  account: {
    id: string;
    name: string;
    plan: string;
    mrr: number;
    seats: number;
    status: string;
    health: string;
    since: string | null;
  } | null;
  lifetimeTickets: number;
  avgCsat: number | null;
}

/** The customer + account behind a ticket, with their lifetime stats. Tolerant:
 *  returns null if the ticket has no linked customer or 0007 isn't applied. */
export async function getCustomerContext(orgId: string, ticketId: string): Promise<CustomerContext | null> {
  try {
    const sb = supabaseAdmin();
    const { data: t } = await sb.from("tickets").select("customer_id").eq("id", ticketId).eq("org_id", orgId).maybeSingle();
    const customerId = (t?.customer_id as string | null | undefined) ?? null;
    if (!customerId) return null;

    const { data: c } = await sb
      .from("customers")
      .select("id,name,email,title,account_id")
      .eq("id", customerId)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!c) return null;

    let account: CustomerContext["account"] = null;
    if (c.account_id) {
      const { data: a } = await sb
        .from("accounts")
        .select("id,name,plan,mrr,seats,status,health,since")
        .eq("id", c.account_id as string)
        .maybeSingle();
      if (a) {
        account = {
          id: a.id as string,
          name: a.name as string,
          plan: a.plan as string,
          mrr: Number(a.mrr ?? 0),
          seats: Number(a.seats ?? 0),
          status: a.status as string,
          health: a.health as string,
          since: (a.since as string | null) ?? null,
        };
      }
    }

    const { data: hist } = await sb.from("tickets").select("csat").eq("org_id", orgId).eq("customer_id", customerId);
    const lifetimeTickets = hist?.length ?? 0;
    const csats = (hist ?? []).map((r) => r.csat as number | null).filter((x): x is number => x != null);
    const avgCsat = csats.length ? csats.reduce((s, x) => s + x, 0) / csats.length : null;

    return {
      customer: { id: c.id as string, name: c.name as string, email: c.email as string, title: (c.title as string | null) ?? null },
      account,
      lifetimeTickets,
      avgCsat,
    };
  } catch {
    return null;
  }
}

// Relationship views: a customer's tickets, an account's people + tickets.
export interface MiniTicket {
  id: string;
  subject: string;
  status: string;
  intent: string | null;
  priority: string;
  csat: number | null;
  created_at: string;
}

export interface CustomerProfile {
  customer: { id: string; name: string; email: string; title: string | null };
  account: { id: string; name: string; plan: string; status: string; health: string } | null;
  tickets: MiniTicket[];
  avgCsat: number | null;
}

export async function getCustomerProfile(orgId: string, customerId: string): Promise<CustomerProfile | null> {
  try {
    const sb = supabaseAdmin();
    const { data: c } = await sb
      .from("customers")
      .select("id,name,email,title,account_id")
      .eq("id", customerId)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!c) return null;
    let account: CustomerProfile["account"] = null;
    if (c.account_id) {
      const { data: a } = await sb
        .from("accounts")
        .select("id,name,plan,status,health")
        .eq("id", c.account_id as string)
        .maybeSingle();
      if (a)
        account = {
          id: a.id as string,
          name: a.name as string,
          plan: a.plan as string,
          status: a.status as string,
          health: a.health as string,
        };
    }
    const { data: tk } = await sb
      .from("tickets")
      .select("id,subject,status,intent,priority,csat,created_at")
      .eq("org_id", orgId)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    const tickets = (tk ?? []) as MiniTicket[];
    const csats = tickets.map((t) => t.csat).filter((x): x is number => x != null);
    const avgCsat = csats.length ? csats.reduce((s, x) => s + x, 0) / csats.length : null;
    return {
      customer: { id: c.id as string, name: c.name as string, email: c.email as string, title: (c.title as string | null) ?? null },
      account,
      tickets,
      avgCsat,
    };
  } catch {
    return null;
  }
}

export interface AccountProfile {
  account: { id: string; name: string; plan: string; mrr: number; seats: number; status: string; health: string; since: string | null };
  customers: { id: string; name: string; email: string; title: string | null; ticketCount: number }[];
  tickets: MiniTicket[];
}

export async function getAccountProfile(orgId: string, accountId: string): Promise<AccountProfile | null> {
  try {
    const sb = supabaseAdmin();
    const { data: a } = await sb
      .from("accounts")
      .select("id,name,plan,mrr,seats,status,health,since")
      .eq("id", accountId)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!a) return null;
    const { data: cs } = await sb.from("customers").select("id,name,email,title").eq("org_id", orgId).eq("account_id", accountId);
    const customers = cs ?? [];
    const ids = customers.map((c) => c.id as string);
    let rows: (MiniTicket & { customer_id: string })[] = [];
    if (ids.length) {
      const { data: tk } = await sb
        .from("tickets")
        .select("id,subject,status,intent,priority,csat,created_at,customer_id")
        .eq("org_id", orgId)
        .in("customer_id", ids)
        .order("created_at", { ascending: false });
      rows = (tk ?? []) as (MiniTicket & { customer_id: string })[];
    }
    const countByCustomer = new Map<string, number>();
    for (const t of rows) countByCustomer.set(t.customer_id, (countByCustomer.get(t.customer_id) ?? 0) + 1);
    return {
      account: {
        id: a.id as string,
        name: a.name as string,
        plan: a.plan as string,
        mrr: Number(a.mrr ?? 0),
        seats: Number(a.seats ?? 0),
        status: a.status as string,
        health: a.health as string,
        since: (a.since as string | null) ?? null,
      },
      customers: customers.map((c) => ({
        id: c.id as string,
        name: c.name as string,
        email: c.email as string,
        title: (c.title as string | null) ?? null,
        ticketCount: countByCustomer.get(c.id as string) ?? 0,
      })),
      tickets: rows.map((t) => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        intent: t.intent,
        priority: t.priority,
        csat: t.csat,
        created_at: t.created_at,
      })),
    };
  } catch {
    return null;
  }
}

export interface AccountListItem {
  id: string;
  name: string;
  plan: string;
  status: string;
  health: string;
  mrr: number;
  customerCount: number;
  ticketCount: number;
  openCount: number;
}

export async function listAccounts(orgId: string): Promise<AccountListItem[]> {
  try {
    const sb = supabaseAdmin();
    const { data: accts } = await sb
      .from("accounts")
      .select("id,name,plan,status,health,mrr")
      .eq("org_id", orgId)
      .order("mrr", { ascending: false });
    if (!accts?.length) return [];
    const { data: custs } = await sb.from("customers").select("id,account_id").eq("org_id", orgId);
    const { data: tks } = await sb.from("tickets").select("status,customer_id").eq("org_id", orgId);
    const acctByCustomer = new Map<string, string>();
    const custCountByAcct = new Map<string, number>();
    for (const c of custs ?? []) {
      const acct = c.account_id as string | null;
      if (acct) {
        acctByCustomer.set(c.id as string, acct);
        custCountByAcct.set(acct, (custCountByAcct.get(acct) ?? 0) + 1);
      }
    }
    const ticketCountByAcct = new Map<string, number>();
    const openByAcct = new Map<string, number>();
    for (const t of tks ?? []) {
      const cid = t.customer_id as string | null;
      const acct = cid ? acctByCustomer.get(cid) : undefined;
      if (acct) {
        ticketCountByAcct.set(acct, (ticketCountByAcct.get(acct) ?? 0) + 1);
        if (t.status === "open" || t.status === "assisted") openByAcct.set(acct, (openByAcct.get(acct) ?? 0) + 1);
      }
    }
    return accts.map((a) => ({
      id: a.id as string,
      name: a.name as string,
      plan: a.plan as string,
      status: a.status as string,
      health: a.health as string,
      mrr: Number(a.mrr ?? 0),
      customerCount: custCountByAcct.get(a.id as string) ?? 0,
      ticketCount: ticketCountByAcct.get(a.id as string) ?? 0,
      openCount: openByAcct.get(a.id as string) ?? 0,
    }));
  } catch {
    return [];
  }
}
