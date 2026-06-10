import type { CSSProperties } from "react";
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

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
}

export async function getOrgBySlug(slug: string): Promise<OrgSummary | null> {
  const { data, error } = await supabaseAdmin().from("organizations").select("id,name,slug").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`getOrgBySlug: ${error.message}`);
  return (data as OrgSummary) ?? null;
}

export async function getOrgById(id: string): Promise<OrgSummary | null> {
  const { data, error } = await supabaseAdmin().from("organizations").select("id,name,slug").eq("id", id).maybeSingle();
  if (error) throw new Error(`getOrgById: ${error.message}`);
  return (data as OrgSummary) ?? null;
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

// ---------------------------------------------------------------------------
// Per-org settings & branding (R4)
// ---------------------------------------------------------------------------
export interface OrgSettings {
  accent?: string; // hex, e.g. "#5e6ad2"
  tagline?: string; // help-center hero subtitle
  threshold?: number; // grounding similarity override
  domain?: string; // custom domain (CNAME) for the help center
  assistant?: boolean; // show the AI chat assistant (default true)
  liveChat?: boolean; // allow escalation to live chat (default true)
  community?: boolean; // show the community section (default true)
  webhookSecret?: string; // bearer secret for the inbound /api/hooks/<slug> webhook
  apiKey?: string; // bearer key for the /api/v1 provisioning API
}

export async function getOrgSettings(orgId: string): Promise<OrgSettings> {
  const { data } = await supabaseAdmin().from("organizations").select("settings").eq("id", orgId).maybeSingle();
  return ((data?.settings as OrgSettings) ?? {}) as OrgSettings;
}

export async function updateOrgSettings(orgId: string, patch: OrgSettings): Promise<void> {
  const current = await getOrgSettings(orgId);
  const { error } = await supabaseAdmin()
    .from("organizations")
    .update({ settings: { ...current, ...patch } })
    .eq("id", orgId);
  if (error) throw new Error(`updateOrgSettings: ${error.message}`);
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** CSS-var overrides (--accent etc.) from a hex accent, for per-org branding. */
export function accentVars(hex?: string): CSSProperties {
  if (!hex) return {};
  const rgb = hexToRgb(hex);
  if (!rgb) return {};
  const [r, g, b] = rgb;
  const strong = rgb.map((c) => Math.round(c * 0.85));
  const soft = rgb.map((c) => Math.round(c + (255 - c) * 0.9));
  const vars: Record<string, string> = {
    "--accent": `${r} ${g} ${b}`,
    "--accent-strong": `${strong[0]} ${strong[1]} ${strong[2]}`,
    "--accent-soft": `${soft[0]} ${soft[1]} ${soft[2]}`,
    "--accent-fg": "255 255 255",
  };
  return vars as unknown as CSSProperties;
}
