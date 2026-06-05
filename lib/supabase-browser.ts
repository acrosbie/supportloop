import { createBrowserClient } from "@supabase/ssr";

/** Auth-aware Supabase client for Client Components (login/signup/logout). */
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
