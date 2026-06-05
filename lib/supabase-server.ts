import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Auth-aware Supabase client for Server Components and route handlers. Reads the
 * user's session from cookies (RLS-enforced). Distinct from supabaseAdmin()
 * (service role) which we keep for seed + privileged server writes.
 */
export function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Server Components can't set cookies — this throws there and is a
          // no-op (session refresh happens in middleware). It works in route
          // handlers and server actions.
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            /* no-op in Server Components */
          }
        },
      },
    }
  );
}
