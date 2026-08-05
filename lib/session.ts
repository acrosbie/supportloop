/**
 * A per-tab identifier for one visit to the help center.
 *
 * It exists so a deflection and a later ticket from the same person can be
 * recognised as one conversation rather than two (see lib/deflection.ts). It is
 * deliberately the weakest identifier that does the job: `sessionStorage`, so it
 * dies with the tab, is never sent to a third party, survives no navigation to
 * another site, and identifies nobody. It is not a tracking cookie and is not a
 * substitute for the JWT identity handshake, which is how a *known* end-user is
 * established.
 */

const KEY = "supportloop.sid";

function makeId(): string {
  // randomUUID needs a secure context; plain-http local dev is not one.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      /* fall through */
    }
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** The current tab's session id, creating one on first use. "" when unavailable. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.sessionStorage.getItem(KEY);
    if (existing) return existing;
    const id = makeId();
    window.sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    // Private modes and blocked storage: correlation is a measurement nicety,
    // never a reason to break the chat.
    return "";
  }
}
