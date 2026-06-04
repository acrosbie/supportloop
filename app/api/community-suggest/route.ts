import { NextRequest } from "next/server";
import { retrieve } from "@/lib/retrieve";
import { decideGrounding } from "@/lib/guardrail";
import { MODEL_GENERATE, anthropic, textOf } from "@/lib/anthropic";
import { getCommunityQuestion, createAiAnswer, flagKnowledgeGap } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Suggest an AI answer to a community question, grounded in the KB. If retrieval
// is weak, flag a knowledge gap and seed a draft stub in the Knowledge Loop —
// the last arrow of the flywheel (community gaps feed new knowledge).
export async function POST(req: NextRequest) {
  let questionId: string;
  try {
    ({ questionId } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const q = await getCommunityQuestion(questionId);
  if (!q) return Response.json({ error: "Question not found" }, { status: 404 });

  const matches = await retrieve(`${q.title}\n${q.body}`, 5);
  const decision = decideGrounding(matches);

  if (!decision.grounded) {
    const draftId = await flagKnowledgeGap(questionId);
    return Response.json({ ok: true, grounded: false, draftId, topSimilarity: Number(decision.topSimilarity.toFixed(3)) });
  }

  const context = decision.sources.map((s, i) => `[Article ${i + 1}: ${s.title}]\n${s.body}`).join("\n\n");
  const system = `You are a helpful community responder for Orbit, a video meeting and collaboration product.
Answer the question using ONLY the help center articles below. Be concise and friendly, and mention the article(s) you drew on. If they don't fully answer it, say what is known and suggest contacting support — do not invent policy.

Knowledge base articles:
${context}`;

  try {
    const msg = await anthropic().messages.create({
      model: MODEL_GENERATE,
      max_tokens: 500,
      system,
      messages: [{ role: "user", content: `${q.title}\n\n${q.body}` }],
    });
    const body = textOf(msg);
    const answerId = await createAiAnswer(questionId, body);
    const sources = decision.sources.map((s) => ({ id: s.id, title: s.title, similarity: Number(s.similarity.toFixed(3)) }));
    return Response.json({ ok: true, grounded: true, answerId, body, sources, topSimilarity: Number(decision.topSimilarity.toFixed(3)) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Suggest failed";
    return Response.json({ ok: false, error: msg }, { status: 502 });
  }
}
