/**
 * Client helper for the grounded streaming endpoints (/api/chat, /api/assist).
 *
 * Those routes stream the answer body token by token and send the grounding
 * decision separately in an `x-grounding` header, so the UI can render
 * citations and a confidence state before the first token arrives. Reading that
 * header and draining the stream was written three times (the help-center
 * widget, the embeddable widget, and the agent's reply composer); this is the
 * single copy.
 *
 * Deliberately a plain async function rather than a React hook: the reply
 * composer is not a chat and has no message list, so a hook shaped around
 * conversation state would not have fit it.
 */

export interface ArticleOrigin {
  /** 'seed' | 'ticket' | 'community' */
  source: string;
  ticketId: string | null;
  publishedAt: string | null;
}

export interface GroundedSource {
  id: string;
  title: string;
  similarity: number;
  /** Where the article came from. Absent on surfaces that don't send it. */
  origin?: ArticleOrigin | null;
}

/**
 * The first cited article that was written from a resolved ticket, if any.
 * This is what makes the knowledge loop visible: the answer the customer is
 * reading exists because someone resolved a ticket and published it.
 */
export function loopClosedSource(sources: GroundedSource[]): GroundedSource | null {
  return sources.find((s) => s.origin?.source === "ticket") ?? null;
}

/** Whole minutes since an ISO timestamp, or null if absent/unparseable. */
export function minutesSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / 60_000));
}

export interface GroundingMeta {
  grounded: boolean;
  topSimilarity: number;
  sources: GroundedSource[];
}

const EMPTY_META: GroundingMeta = { grounded: false, topSimilarity: 0, sources: [] };

export interface StreamHandlers {
  /** Fires once, before any text, with the grounding decision. */
  onMeta?: (meta: GroundingMeta) => void;
  /** Fires per chunk with the full accumulated text so far. */
  onText: (text: string) => void;
}

/**
 * POSTs `body`, reports the grounding metadata, then streams the response.
 * Resolves with the complete text. Throws with the server's error message when
 * the request fails, so callers can surface it however suits their surface.
 */
export async function streamGrounded(
  url: string,
  body: unknown,
  { onMeta, onText }: StreamHandlers
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || "The assistant is unavailable right now.");
  }

  if (onMeta) onMeta(parseGroundingHeader(res.headers.get("x-grounding")));

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += decoder.decode(value, { stream: true });
    onText(acc);
  }
  return acc;
}

/** Tolerant of a missing or malformed header: metadata is an enhancement. */
export function parseGroundingHeader(raw: string | null): GroundingMeta {
  if (!raw) return EMPTY_META;
  try {
    const parsed = JSON.parse(raw) as Partial<GroundingMeta>;
    return {
      grounded: Boolean(parsed.grounded),
      topSimilarity: typeof parsed.topSimilarity === "number" ? parsed.topSimilarity : 0,
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    };
  } catch {
    return EMPTY_META;
  }
}
