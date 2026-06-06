import { supabaseAdmin } from "./supabase";
import { getAuth } from "./auth";

// The fictional org used for the public demo / anonymous customer surfaces.
export const DEMO_ORG_SLUG = "orbit";

let cachedDemoOrgId: string | null = null;

export async function getOrgIdBySlug(slug: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin().from("organizations").select("id").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`getOrgIdBySlug: ${error.message}`);
  return (data?.id as string) ?? null;
}

export async function getDemoOrgId(): Promise<string> {
  if (cachedDemoOrgId) return cachedDemoOrgId;
  const id = await getOrgIdBySlug(DEMO_ORG_SLUG);
  if (!id) throw new Error("Demo org not found — run the tenancy migration + seed.");
  cachedDemoOrgId = id;
  return id;
}

/**
 * The org whose customer-facing surfaces the current viewer should see:
 * the signed-in user's org, or the demo org for anonymous visitors.
 */
export async function resolveViewerOrgId(): Promise<string> {
  const auth = await getAuth();
  return auth?.orgId ?? (await getDemoOrgId());
}
