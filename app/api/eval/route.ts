import { embed } from "@/lib/embeddings";
import { matchKb } from "@/lib/retrieve";
import { SIMILARITY_THRESHOLD } from "@/lib/guardrail";
import { insertEvalRun, logAiTrace, type EvalResultRow } from "@/lib/data";
import { orgIdWithPermission } from "@/lib/auth";
import { MODEL_CLASSIFY, anthropic, textOf } from "@/lib/anthropic";
import questions from "@/supabase/seed/eval-questions.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface GoldenQ {
  question: string;
  expected: "answer" | "escalate";
  note?: string;
}
type Row = EvalResultRow & { faithful?: boolean | null };

// Run the golden set through the real retrieval pipeline and grade each: did
// "answer" questions ground above threshold, and "escalate" questions fall
// below it? Then, for a sample of the grounded "answer" questions, run an
// LLM-as-judge FAITHFULNESS check — generate an answer from the retrieved
// context and verify every claim is supported by it (a hallucination check).
export async function POST() {
  const qs = questions as GoldenQ[];
  // Matches the middleware gate on /ops — role alone isn't enough.
  const orgId = await orgIdWithPermission("ops.view");
  if (!orgId) return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const embeddings = await embed(
      qs.map((q) => q.question),
      "query"
    );
    const results: Row[] = [];
    const contexts: (string | null)[] = [];
    for (let i = 0; i < qs.length; i++) {
      const matches = await matchKb(embeddings[i], orgId, 3);
      const top = matches[0]?.similarity ?? 0;
      const grounded = top >= SIMILARITY_THRESHOLD;
      const pass = qs[i].expected === "answer" ? grounded : !grounded;
      results.push({ question: qs[i].question, expected: qs[i].expected, grounded, pass, similarity: Number(top.toFixed(3)) });
      contexts[i] =
        grounded && qs[i].expected === "answer" ? matches.slice(0, 2).map((m) => m.body).join("\n\n") : null;
    }

    let faithfulChecked = 0;
    let faithfulPass = 0;
    const toCheck = results.map((r, i) => ({ r, i })).filter(({ i }) => contexts[i] != null).slice(0, 4);
    for (const { r, i } of toCheck) {
      try {
        const ctx = contexts[i] as string;
        const ans = await anthropic().messages.create({
          model: MODEL_CLASSIFY,
          max_tokens: 220,
          system: "Answer the question using ONLY the context provided. Be concise.",
          messages: [{ role: "user", content: `Context:\n${ctx}\n\nQuestion: ${r.question}` }],
        });
        const answer = textOf(ans);
        const judge = await anthropic().messages.create({
          model: MODEL_CLASSIFY,
          max_tokens: 5,
          system:
            'You grade answer faithfulness. Reply with ONLY "yes" or "no": is every factual claim in the ANSWER supported by the CONTEXT?',
          messages: [{ role: "user", content: `CONTEXT:\n${ctx}\n\nANSWER:\n${answer}` }],
        });
        const faithful = /^\s*yes/i.test(textOf(judge));
        r.faithful = faithful;
        faithfulChecked++;
        if (faithful) faithfulPass++;
        await logAiTrace(orgId, {
          surface: "eval",
          model: MODEL_CLASSIFY,
          latencyMs: 0,
          inputTokens: ans.usage.input_tokens + judge.usage.input_tokens,
          outputTokens: ans.usage.output_tokens + judge.usage.output_tokens,
        });
      } catch {
        r.faithful = null;
      }
    }

    const groundedCount = results.filter((r) => r.grounded).length;
    const passed = results.filter((r) => r.pass).length;
    const avg = results.reduce((s, r) => s + r.similarity, 0) / (results.length || 1);
    const base = { total: results.length, grounded: groundedCount, passed, avg_similarity: Number(avg.toFixed(3)), results };
    await insertEvalRun(orgId, base);
    return Response.json({
      ...base,
      faithfulness_rate: faithfulChecked ? Number((faithfulPass / faithfulChecked).toFixed(3)) : null,
      faithful_checked: faithfulChecked,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Eval failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
