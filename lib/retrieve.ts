import { supabaseAdmin } from "./supabase";
import { embedOne, toVector } from "./embeddings";

export interface KbMatch {
  id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  similarity: number;
}

/** Run org-scoped match_kb with an already-computed query embedding. */
export async function matchKb(embedding: number[], orgId: string, k = 5, minSimilarity = 0): Promise<KbMatch[]> {
  const { data, error } = await supabaseAdmin().rpc("match_kb", {
    query_embedding: toVector(embedding),
    p_org_id: orgId,
    match_count: k,
    min_similarity: minSimilarity,
  });
  if (error) throw new Error(`match_kb failed: ${error.message}`);
  return (data ?? []) as KbMatch[];
}

export async function retrieve(query: string, orgId: string, k = 5, minSimilarity = 0): Promise<KbMatch[]> {
  const embedding = await embedOne(query, "query");
  return matchKb(embedding, orgId, k, minSimilarity);
}

export interface TicketMatch {
  id: string;
  subject: string;
  body: string;
  intent: string | null;
  status: string;
  similarity: number;
}

/** Org-scoped semantic search over resolved tickets, excluding the current one. */
export async function matchTickets(
  embedding: number[],
  orgId: string,
  excludeId: string,
  k = 3,
  minSimilarity = 0.5
): Promise<TicketMatch[]> {
  const { data, error } = await supabaseAdmin().rpc("match_tickets", {
    query_embedding: toVector(embedding),
    p_org_id: orgId,
    exclude_id: excludeId,
    match_count: k,
    min_similarity: minSimilarity,
  });
  if (error) throw new Error(`match_tickets failed: ${error.message}`);
  return (data ?? []) as TicketMatch[];
}
