/**
 * The scoring half of the eval harness, with no I/O.
 *
 * `/api/eval` runs the golden set against live Voyage embeddings and the
 * pgvector `match_kb` RPC. That is the right thing to run on demand, and the
 * wrong thing to run on every push: it needs API keys, costs money per commit,
 * and is non-deterministic enough that a red build would not always mean a real
 * regression.
 *
 * So the ranking maths lives here, and CI replays it against recorded vectors
 * (see scripts/record-eval-fixture.ts). What that gates is the *decision layer*:
 * the guardrail threshold, the grounded/escalate call, the ranking order.
 *
 * What it deliberately does NOT gate, because the vectors are frozen: a change
 * of embedding model, or edits to the KB itself. Those need a re-record and the
 * live run. Saying so plainly matters — a gate whose limits are undocumented
 * gets trusted for things it never checked.
 */

export interface GoldenQuestion {
  question: string;
  expected: "answer" | "escalate";
  note?: string;
}

export interface CorpusArticle {
  id: string;
  title: string;
  embedding: number[];
}

export interface ScoredArticle {
  id: string;
  title: string;
  similarity: number;
}

export interface EvalRow {
  question: string;
  expected: "answer" | "escalate";
  grounded: boolean;
  pass: boolean;
  similarity: number;
  topTitle: string | null;
}

export interface EvalBreakdown {
  total: number;
  passed: number;
}

export interface EvalSummary {
  total: number;
  passed: number;
  /** Share of the golden set whose grounded/escalate call was correct. */
  passRate: number;
  /** Share of all questions that grounded, right or wrong. */
  groundedRate: number;
  avgSimilarity: number;
  rows: EvalRow[];
  /**
   * Split by what the question expects. A single pass rate hides the failure
   * that matters most: a threshold drifting low still "passes" every answer
   * question while silently letting escalate questions through as answers.
   */
  answer: EvalBreakdown;
  escalate: EvalBreakdown;
}

/**
 * Cosine similarity, matching `1 - (embedding <=> query_embedding)` from the
 * match_kb SQL function so recorded runs and live runs agree.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Top-k articles by cosine similarity, mirroring match_kb's ordering. */
export function rankByCosine(query: number[], corpus: CorpusArticle[], k = 3): ScoredArticle[] {
  return corpus
    .map((a) => ({ id: a.id, title: a.title, similarity: cosineSimilarity(query, a.embedding) }))
    .sort((x, y) => y.similarity - x.similarity)
    .slice(0, k);
}

/**
 * Grades the golden set: "answer" questions must ground at or above threshold,
 * "escalate" questions must fall below it. Escalate questions are the half that
 * catches a threshold set too low, which is the regression that actually hurts,
 * because it is the one that invents policy at a customer.
 */
export function gradeGoldenSet(
  questions: GoldenQuestion[],
  vectors: number[][],
  corpus: CorpusArticle[],
  threshold: number
): EvalSummary {
  const rows: EvalRow[] = questions.map((q, i) => {
    const top = rankByCosine(vectors[i] ?? [], corpus, 3)[0];
    const similarity = top?.similarity ?? 0;
    const grounded = similarity >= threshold;
    return {
      question: q.question,
      expected: q.expected,
      grounded,
      pass: q.expected === "answer" ? grounded : !grounded,
      similarity: Number(similarity.toFixed(4)),
      topTitle: top?.title ?? null,
    };
  });

  const split = (kind: "answer" | "escalate"): EvalBreakdown => {
    const subset = rows.filter((r) => r.expected === kind);
    return { total: subset.length, passed: subset.filter((r) => r.pass).length };
  };

  const total = rows.length;
  const passed = rows.filter((r) => r.pass).length;
  const groundedCount = rows.filter((r) => r.grounded).length;
  const avg = total ? rows.reduce((s, r) => s + r.similarity, 0) / total : 0;

  return {
    total,
    passed,
    passRate: total ? passed / total : 0,
    groundedRate: total ? groundedCount / total : 0,
    avgSimilarity: Number(avg.toFixed(4)),
    rows,
    answer: split("answer"),
    escalate: split("escalate"),
  };
}
