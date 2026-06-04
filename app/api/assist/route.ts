import { NextRequest } from "next/server";
import { retrieve } from "@/lib/retrieve";
import { decideGrounding } from "@/lib/guardrail";
import { MODEL_GENERATE, streamMessageText } from "@/lib/anthropic";
import { getTicket } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Draft a grounded reply for the agent. Same guardrail as the customer chatbot:
// grounded in retrieved KB, or it tells the agent to handle manually rather than
// inventing policy. Streams the draft; grounding rides in the x-grounding header.
export async function POST(req: NextRequest) {
  let ticketId: string;
  try {
    ({ ticketId } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const ticket = await getTicket(ticketId);
  if (!ticket) return Response.json({ error: "Ticket not found" }, { status: 404 });

  const matches = await retrieve(`${ticket.subject}\n${ticket.body}`, 5);
  const decision = decideGrounding(matches);
  const sources = decision.sources.map((s) => ({
    id: s.id,
    title: s.title,
    similarity: Number(s.similarity.toFixed(3)),
  }));
  const meta = {
    grounded: decision.grounded,
    topSimilarity: Number(decision.topSimilarity.toFixed(3)),
    threshold: decision.threshold,
    sources,
  };

  const context = decision.grounded
    ? decision.sources.map((s, i) => `[Article ${i + 1}: ${s.title}]\n${s.body}`).join("\n\n")
    : "(No sufficiently relevant help-center articles were found.)";

  const system = `You are an AI assistant helping a human Orbit support agent draft a reply to a customer.
Write the reply to the customer, grounded ONLY in the knowledge base articles below.
- Address the customer directly, friendly and concise.
- If the articles answer it, write the full reply and mention which article(s) it draws on.
- If the articles do NOT cover it, do NOT invent policy, pricing, or steps. Write a short, honest holding reply that acknowledges the issue and says a teammate will follow up — and add a one-line note to the agent (prefixed "Agent note:") that this needs manual handling.

Knowledge base articles:
${context}`;

  const stream = streamMessageText({
    model: MODEL_GENERATE,
    max_tokens: 700,
    system,
    messages: [
      {
        role: "user",
        content: `Draft a reply to this customer.\n\nSubject: ${ticket.subject}\n\nCustomer message: ${ticket.body}`,
      },
    ],
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "x-grounding": JSON.stringify(meta),
    },
  });
}
