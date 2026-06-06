// Shared types mirroring the Supabase schema (supabase/migrations/0001_init.sql).

export type ArticleStatus = "published" | "draft";
export type ArticleSource = "seed" | "ticket" | "community";

export interface KbArticle {
  id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  status: ArticleStatus;
  source: ArticleSource;
  created_from_ticket_id: string | null;
  created_from_question_id: string | null;
  created_at: string;
  published_at: string | null;
}

export type TicketStatus = "open" | "assisted" | "resolved" | "deflected";
export type Urgency = "low" | "medium" | "high";

export interface Ticket {
  id: string;
  subject: string;
  body: string;
  channel: string;
  status: TicketStatus;
  intent: string | null;
  urgency: Urgency | null;
  queue: string | null;
  sentiment: string | null;
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

export type MessageRole = "customer" | "agent" | "ai";

export interface TicketMessage {
  id: string;
  ticket_id: string;
  role: MessageRole;
  body: string;
  internal: boolean;
  created_at: string;
}

export type CommunityStatus = "open" | "answered";

export interface CommunityQuestion {
  id: string;
  title: string;
  body: string;
  status: CommunityStatus;
  has_kb_gap: boolean;
  created_at: string;
}

export interface CommunityAnswer {
  id: string;
  question_id: string;
  body: string;
  source: "ai" | "user";
  accepted: boolean;
  upvotes: number;
  created_at: string;
}

export type EventType =
  | "deflection"
  | "escalation"
  | "resolution"
  | "kb_publish"
  | "community_answer"
  | "gap_flagged";

export interface SupportEvent {
  id: string;
  type: EventType;
  ticket_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface EvalRun {
  id: string;
  total: number;
  grounded: number;
  passed: number;
  avg_similarity: number;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: Record<string, unknown>;
  created_at: string;
}

// Persona switcher (top bar) — orients a visitor across surfaces. Cosmetic in the demo.
export type Persona = "customer" | "agent" | "ops";

export interface Profile {
  id: string;
  role: "customer" | "agent" | "admin";
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface CannedResponse {
  id: string;
  title: string;
  body: string;
  category: string | null;
  created_at: string;
}
