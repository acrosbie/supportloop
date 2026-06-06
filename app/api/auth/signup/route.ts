import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "workspace"
  );
}

// Productized signup: a support team creates a NEW organization and becomes its
// first admin. Email is pre-confirmed for the demo; the profile row is created
// by the on_auth_user_created trigger with org_id pulled from app_metadata. The
// client then signs in to establish the cookie session.
export async function POST(req: NextRequest) {
  let email: string;
  let password: string;
  let name: string | undefined;
  let company: string | undefined;
  try {
    ({ email, password, name, company } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!email || !password) return Response.json({ error: "Email and password are required" }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  const orgName = company?.trim() || `${name?.trim() || email.split("@")[0]}'s workspace`;

  const sb = supabaseAdmin();

  // Create the org with a unique slug.
  let slug = slugify(orgName);
  const { data: taken } = await sb.from("organizations").select("id").eq("slug", slug).maybeSingle();
  if (taken) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  const { data: org, error: orgErr } = await sb
    .from("organizations")
    .insert({ name: orgName, slug, plan: "free" })
    .select("id")
    .single();
  if (orgErr || !org) return Response.json({ error: orgErr?.message ?? "Could not create workspace" }, { status: 400 });

  const { error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin", org_id: org.id },
    user_metadata: { display_name: name?.trim() || email.split("@")[0] },
  });
  if (error) {
    // Roll back the empty org if the user couldn't be created (e.g. email taken).
    await sb.from("organizations").delete().eq("id", org.id);
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ ok: true });
}
