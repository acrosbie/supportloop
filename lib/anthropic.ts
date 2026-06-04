import Anthropic from "@anthropic-ai/sdk";

// Two models, both swappable from this one file:
//  - GENERATE: visible generative surfaces (chat answer, agent draft, KB draft, community answer)
//  - CLASSIFY: triage, sentiment, eval grading (fast + cheap)
export const MODEL_GENERATE = "claude-sonnet-4-6";
export const MODEL_CLASSIFY = "claude-haiku-4-5-20251001";

let client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing required env var: ANTHROPIC_API_KEY");
  client = new Anthropic({ apiKey });
  return client;
}

/**
 * Pull the first JSON object/array out of a model response. We instruct models to
 * return raw JSON, but this tolerates stray prose or ```json fences just in case.
 */
export function parseJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) throw new Error(`No JSON found in model output: ${text.slice(0, 200)}`);
  const slice = candidate.slice(start).trim();
  return JSON.parse(slice) as T;
}

/** Concatenate the text blocks of a non-streaming message response. */
export function textOf(message: { content: Array<{ type: string; text?: string }> }): string {
  return message.content
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text ?? "")
    .join("");
}
