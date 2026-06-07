import { NextRequest } from "next/server";
import { embed } from "@/lib/embeddings";
import { MODEL_GENERATE, anthropic, textOf } from "@/lib/anthropic";
import { SIMILARITY_THRESHOLD } from "@/lib/guardrail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Ephemeral RAG over pasted docs — the same grounded pipeline as the product,
// but nothing is stored: chunk → embed → cosine → grounded answer (or escalate).
function chunk(text: string): string[] {
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const p of paras) {
    if (p.length <= 800) out.push(p);
    else for (let i = 0; i < p.length; i += 800) out.push(p.slice(i, i + 800));
  }
  return out.slice(0, 40);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

export async function POST(req: NextRequest) {
  let docs: string;
  let question: string;
  try {
    ({ docs, question } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!docs?.trim() || !question?.trim()) {
    return Response.json({ error: "Paste some docs and ask a question." }, { status: 400 });
  }
  const chunks = chunk(docs);
  if (!chunks.length) return Response.json({ error: "No content found in your docs." }, { status: 400 });

  try {
    const [docVecs, qVecs] = await Promise.all([embed(chunks, "document"), embed([question], "query")]);
    const qVec = qVecs[0];
    const scored = chunks
      .map((c, i) => ({ c, sim: cosine(docVecs[i], qVec) }))
      .sort((a, b) => b.sim - a.sim);
    const top = scored.slice(0, 3);
    const topSim = top[0]?.sim ?? 0;
    const grounded = topSim >= SIMILARITY_THRESHOLD;

    if (!grounded) {
      return Response.json({ ok: true, grounded: false, topSimilarity: Number(topSim.toFixed(3)), answer: null });
    }

    const context = top.map((t, i) => `[Excerpt ${i + 1}]\n${t.c}`).join("\n\n");
    const system = `Answer the user's question using ONLY the excerpts from their documentation below. Be concise and friendly. If the excerpts don't fully answer it, say what is supported and suggest adding more docs — never invent policy, prices, or steps.\n\nDocumentation excerpts:\n${context}`;
    const msg = await anthropic().messages.create({
      model: MODEL_GENERATE,
      max_tokens: 500,
      system,
      messages: [{ role: "user", content: question }],
    });
    return Response.json({
      ok: true,
      grounded: true,
      topSimilarity: Number(topSim.toFixed(3)),
      answer: textOf(msg),
      sources: top.map((t) => t.c.slice(0, 140)),
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
