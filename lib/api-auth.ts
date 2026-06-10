import { supabaseAdmin } from "./supabase";

/** Extract a Bearer token from a request. */
export function bearer(req: Request): string | null {
  const h = req.headers.get("authorization");
  return h && h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

/** Resolve the org whose settings.apiKey matches (org-scoped public API auth).
 *  Scans organizations (few rows); keys live in organizations.settings.apiKey. */
export async function orgIdFromApiKey(key: string | null): Promise<string | null> {
  if (!key || key.length < 8) return null;
  try {
    const { data } = await supabaseAdmin().from("organizations").select("id,settings");
    for (const o of data ?? []) {
      const k = (o.settings as { apiKey?: string } | null)?.apiKey;
      if (k && k === key) return o.id as string;
    }
  } catch {
    /* */
  }
  return null;
}

/** The org id for a request's API key, or null. */
export function apiOrgId(req: Request): Promise<string | null> {
  return orgIdFromApiKey(bearer(req));
}
