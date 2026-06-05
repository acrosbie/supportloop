import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Create a customer account (admin API, email pre-confirmed for the demo). The
// profile row is created by the on_auth_user_created trigger. The client then
// signs in to establish the cookie session.
export async function POST(req: NextRequest) {
  let email: string;
  let password: string;
  let name: string | undefined;
  try {
    ({ email, password, name } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!email || !password) return Response.json({ error: "Email and password are required" }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const { error } = await supabaseAdmin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "customer" },
    user_metadata: { display_name: name?.trim() || email.split("@")[0] },
  });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
