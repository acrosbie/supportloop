import { waitUntil } from "@vercel/functions";

/**
 * Run work after the response is sent, so customer-facing requests stay snappy.
 * On Vercel, waitUntil keeps the function alive until the work completes;
 * elsewhere (local dev) the promise simply runs to completion in-process.
 * Never throws to the caller; errors are swallowed.
 */
export function runInBackground(work: () => Promise<unknown>): void {
  let p: Promise<unknown>;
  try {
    p = Promise.resolve(work());
  } catch {
    return;
  }
  const safe = p.catch(() => {});
  try {
    waitUntil(safe);
  } catch {
    /* no serverless context (e.g. local dev) — the promise still runs in-process */
  }
}
