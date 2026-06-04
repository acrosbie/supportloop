// Server-side data access layer. Used by server components (reads) and route
// handlers (writes). Always uses the service-role client — never import this
// from a client component.
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "./supabase";
import type { KbArticle, Ticket, TicketMessage, EventType } from "./types";

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
