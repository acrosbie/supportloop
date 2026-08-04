import { NextRequest } from "next/server";
import { retrieve } from "@/lib/retrieve";
import { decideGrounding } from "@/lib/guardrail";
import { MODEL_GENERATE, streamMessageText } from "@/lib/anthropic";
import { logEvent, logAiTrace, getArticleProvenance } from "@/lib/data";
import { resolveViewerOrgId, getOrgIdBySlug, getOrgSettings } from "@/lib/org";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Customer chatbot. Retrieve top-K KB → decide grounding → stream a grounded
// answer (or a clean "I can't answer, want a ticket?"). The grounding decision
// (confidence + cited sources) rides along in the `x-grounding` header so the
// client can render citation chips and a confidence indicator.
export async function POST(req: NextRequest) {
  let message: string;
  let orgSlug: string | undefined;
  try {
    ({ message, orgSlug } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!message || typeof message !== "string") {
    return Response.json({ error: 'Missing "message" string' }, { status: 400 });
  }

  // Embeddable widget passes its workspace slug; in-app surfaces use the viewer's org.
  const orgId = orgSlug ? await getOrgIdBySlug(orgSlug) : await resolveViewerOrgId();
  if (!orgId) return Response.json({ error: "Unknown workspace" }, { status: 404 });
  const t0 = Date.now();
  let matches;
  try {
    matches = await retrieve(message, orgId, 5);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Retrieval failed";
    return Response.json({ error: msg }, { status: 500 });
  }

  const settings = await getOrgSettings(orgId);
  const decision = decideGrounding(matches, settings.threshold);
  await logAiTrace(orgId, {
    surface: "chat",
    model: MODEL_GENERATE,
    latencyMs: Date.now() - t0,
    grounded: decision.grounded,
    topSimilarity: decision.topSimilarity,
  });
  // Attach provenance so the UI can show when an answer came from an article
  // that a human published off a resolved ticket — the loop visibly closing.
  const provenance = decision.grounded
    ? await getArticleProvenance(
        orgId,
        decision.sources.map((s) => s.id)
      )
    : {};
  const sources = decision.sources.map((s) => ({
    id: s.id,
    title: s.title,
    similarity: Number(s.similarity.toFixed(3)),
    origin: provenance[s.id] ?? null,
  }));
  const meta = {
    grounded: decision.grounded,
    topSimilarity: Number(decision.topSimilarity.toFixed(3)),
    threshold: decision.threshold,
    sources,
  };

  const context = decision.grounded
    ? decision.sources.map((s, i) => `[Article ${i + 1}: ${s.title}]\n${s.body}`).join("\n\n")
    : "(No sufficiently relevant help-center articles were found for this question.)";

  const system = `You are the Orbit Help Center assistant. Orbit is a video meeting and collaboration product.
Answer the customer using ONLY the knowledge base articles provided below.
- If the articles answer the question: give a concise, friendly answer (2-4 sentences) and mention the article title(s) you used.
- If the articles do NOT contain the answer: do not guess or invent any policy, price, or steps. Briefly say you can't answer this from the help center and offer to create a support ticket for a human teammate.
Never fabricate refund amounts, security policy, or features that aren't in the articles.

Knowledge base articles:
${context}`;

  // A grounded answer is a deflection (resolved without an agent).
  if (decision.grounded) {
    await logEvent(orgId, "deflection", null, { query: message.slice(0, 200), top: sources[0]?.title ?? null });
  }

  const stream = streamMessageText({
    model: MODEL_GENERATE,
    max_tokens: 600,
    system,
    messages: [{ role: "user", content: message }],
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "x-grounding": JSON.stringify(meta),
    },
  });
}
