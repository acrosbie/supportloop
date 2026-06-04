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

/**
 * Embed a query and find the most similar published KB articles via the
 * match_kb() pgvector function. Returns matches with cosine similarity scores.
 */
/** Run match_kb with an already-computed query embedding (lets callers batch embeds). */
export async function matchKb(embedding: number[], k = 5, minSimilarity = 0): Promise<KbMatch[]> {
  const { data, error } = await supabaseAdmin().rpc("match_kb", {
    query_embedding: toVector(embedding),
    match_count: k,
    min_similarity: minSimilarity,
  });
  if (error) throw new Error(`match_kb failed: ${error.message}`);
  return (data ?? []) as KbMatch[];
}

export async function retrieve(query: string, k = 5, minSimilarity = 0): Promise<KbMatch[]> {
  const embedding = await embedOne(query, "query");
  return matchKb(embedding, k, minSimilarity);
}
