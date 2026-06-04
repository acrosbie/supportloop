import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Env is read lazily (inside the getters) so that importing this module never
// throws at build time when keys are absent — only actual usage requires them.
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

// supabase-js issues its queries via fetch, which Next.js caches by default in
// Server Components. That would serve stale reads as data changes, so force
// every Supabase request to bypass the Next fetch cache.
const noStoreFetch = (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) =>
  fetch(input, { ...init, cache: "no-store" });

let adminClient: SupabaseClient | null = null;

/**
 * Server-only client using the service-role key. Bypasses RLS — use it only in
 * route handlers and the seed script, never in client components.
 */
export function supabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;
  adminClient = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: noStoreFetch },
    }
  );
  return adminClient;
}

/** Anon client (RLS-enforced). Safe for reads of published KB + community. */
export function supabaseBrowser(): SupabaseClient {
  return createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false } }
  );
}
