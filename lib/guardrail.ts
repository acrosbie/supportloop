import type { KbMatch } from "./retrieve";

// The grounding guardrail: an answer is only allowed if retrieval found KB
// content above this similarity threshold. Below it, the surface must escalate
// to a human rather than invent policy.
// Tuned to voyage-3-lite's compressed range against the seeded KB: uncovered
// topics top out around 0.56 and well-covered ones start around 0.62, so 0.60
// cleanly separates them (a couple of weakly-phrased covered queries escalate —
// the intended "escalate when unsure" behavior).
export const SIMILARITY_THRESHOLD = 0.6;

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
  // Cite only confident matches (at/above threshold) so citation chips never
  // imply an article that wasn't actually relevant.
  const sources = grounded ? matches.filter((m) => m.similarity >= threshold) : [];
  return { grounded, topSimilarity, threshold, sources };
}
