// Embeddings via Voyage AI (Anthropic's recommended partner), behind a tiny
// interface so the provider can be swapped without touching callers.
// voyage-3-lite returns 512-dim vectors — keep EMBED_DIM in sync with the
// pgvector column dimension in supabase/migrations/0001_init.sql.

export const EMBED_MODEL = "voyage-3-lite";
export const EMBED_DIM = 512;

type InputType = "document" | "query";

/** Format a JS number[] as a pgvector text literal: [0.1,0.2,...]. */
export function toVector(values: number[]): string {
  return `[${values.join(",")}]`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POST to Voyage with retry/backoff. The free tier is rate-limited to 3 RPM
 * until a payment method is added, so 429s are expected under bursty use —
 * back off and retry rather than failing the whole request.
 */
async function voyageFetch(apiKey: string, body: unknown, attempt = 0): Promise<Response> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 4) {
    const wait = Math.min(20000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 400);
    await sleep(wait);
    return voyageFetch(apiKey, body, attempt + 1);
  }
  return res;
}

/**
 * Embed a batch of texts. `inputType` lets Voyage optimize asymmetrically:
 * "document" for stored content, "query" for search queries.
 */
export async function embed(texts: string[], inputType: InputType = "document"): Promise<number[][]> {
  if (texts.length === 0) return [];
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("Missing required env var: VOYAGE_API_KEY");

  const out: number[][] = [];
  const BATCH = 100;
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const res = await voyageFetch(apiKey, { input: batch, model: EMBED_MODEL, input_type: inputType });
    if (!res.ok) {
      throw new Error(`Voyage embeddings failed (${res.status}): ${await res.text()}`);
    }
    const json = (await res.json()) as { data: Array<{ embedding: number[]; index: number }> };
    for (const d of json.data.sort((a, b) => a.index - b.index)) out.push(d.embedding);
  }
  return out;
}

export async function embedOne(text: string, inputType: InputType = "query"): Promise<number[]> {
  const [vector] = await embed([text], inputType);
  return vector;
}
