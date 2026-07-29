import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Cost protection for the public demo: the LLM-backed routes are rate-limited
// per visitor IP, with a global daily ceiling as a backstop against a
// distributed script running up the Anthropic/Voyage bill.
//
// Fully optional: if the Upstash env vars are absent (e.g. local dev), this
// no-ops and every request is allowed, so nothing breaks without setup.

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

// Per-IP sliding window and a global fixed daily budget. Both tunable via env.
const IP_PER_MIN = Number(process.env.RATELIMIT_IP_PER_MIN ?? 15);
const GLOBAL_PER_DAY = Number(process.env.RATELIMIT_GLOBAL_PER_DAY ?? 2000);

let ipLimiter: Ratelimit | null = null;
let globalLimiter: Ratelimit | null = null;

if (url && token) {
  const redis = new Redis({ url, token });
  ipLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(IP_PER_MIN, "1 m"),
    prefix: "sl:ai:ip",
    analytics: false,
  });
  globalLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(GLOBAL_PER_DAY, "1 d"),
    prefix: "sl:ai:global",
    analytics: false,
  });
}

export const rateLimitEnabled = Boolean(ipLimiter && globalLimiter);

export interface RateLimitResult {
  ok: boolean;
  scope?: "ip" | "global";
  limit?: number;
  remaining?: number;
  reset?: number; // epoch ms when the limiting window resets
}

/**
 * Check the per-IP limit, then the global daily budget. Returns { ok: true }
 * (allow) when rate limiting is not configured, so local dev is unaffected.
 */
export async function checkAiRateLimit(ip: string): Promise<RateLimitResult> {
  if (!ipLimiter || !globalLimiter) return { ok: true };

  const perIp = await ipLimiter.limit(ip);
  if (!perIp.success) {
    return { ok: false, scope: "ip", limit: perIp.limit, remaining: perIp.remaining, reset: perIp.reset };
  }

  const global = await globalLimiter.limit("all");
  if (!global.success) {
    return { ok: false, scope: "global", limit: global.limit, remaining: global.remaining, reset: global.reset };
  }

  return { ok: true, limit: perIp.limit, remaining: perIp.remaining, reset: perIp.reset };
}
