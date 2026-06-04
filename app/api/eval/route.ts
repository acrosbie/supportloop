import { embed } from "@/lib/embeddings";
import { matchKb } from "@/lib/retrieve";
import { SIMILARITY_THRESHOLD } from "@/lib/guardrail";
import { insertEvalRun, type EvalResultRow } from "@/lib/data";
import questions from "@/supabase/seed/eval-questions.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface GoldenQ {
  question: string;
  expected: "answer" | "escalate";
  note?: string;
}

// Run the golden set through the real retrieval pipeline and grade each:
// did "answer" questions ground above threshold, and did "escalate" questions
// fall below it? All queries are embedded in ONE Voyage call to stay within the
// free-tier rate limit, then matched individually (fast DB RPCs).
export async function POST() {
  const qs = questions as GoldenQ[];
  try {
    const embeddings = await embed(
      qs.map((q) => q.question),
      "query"
    );
    const results: EvalResultRow[] = [];
    for (let i = 0; i < qs.length; i++) {
      const matches = await matchKb(embeddings[i], 3);
      const top = matches[0]?.similarity ?? 0;
      const grounded = top >= SIMILARITY_THRESHOLD;
      const pass = qs[i].expected === "answer" ? grounded : !grounded;
      results.push({
        question: qs[i].question,
        expected: qs[i].expected,
        grounded,
        pass,
        similarity: Number(top.toFixed(3)),
      });
    }
    const groundedCount = results.filter((r) => r.grounded).length;
    const passed = results.filter((r) => r.pass).length;
    const avg = results.reduce((s, r) => s + r.similarity, 0) / (results.length || 1);
    const summary = { total: results.length, grounded: groundedCount, passed, avg_similarity: Number(avg.toFixed(3)), results };
    await insertEvalRun(summary);
    return Response.json(summary);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Eval failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
