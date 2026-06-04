import type { KbMatch } from "./retrieve";

// The grounding guardrail: an answer is only allowed if retrieval found KB
// content above this similarity threshold. Below it, the surface must escalate
// to a human rather than invent policy. Tune as embeddings/KB evolve.
export const SIMILARITY_THRESHOLD = 0.5;

export interface GroundingDecision {
  grounded: boolean;
  topSimilarity: number;
  threshold: number;
  /** Articles strong enough to cite when grounded. */
  sources: KbMatch[];
}

export function decideGrounding(
  matches: KbMatch[],
  threshold = SIMILARITY_THRESHOLD
): GroundingDecision {
  const topSimilarity = matches[0]?.similarity ?? 0;
  const grounded = topSimilarity >= threshold;
  // When grounded, cite anything within a small band of the top hit.
  const sources = grounded ? matches.filter((m) => m.similarity >= threshold - 0.1) : [];
  return { grounded, topSimilarity, threshold, sources };
}
