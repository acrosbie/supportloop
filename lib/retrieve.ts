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
