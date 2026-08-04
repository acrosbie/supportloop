import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { runSlaSweep } from "@/lib/workflows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Scheduled SLA breach sweep across all orgs (wired via vercel.json cron).
// Vercel sends CRON_SECRET as a Bearer token. This fails closed: with no secret
// configured the endpoint stays shut rather than exposing an unauthenticated
// all-org sweep, which is what an unset env var would otherwise produce.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response("CRON_SECRET is not configured", { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { data: orgs } = await supabaseAdmin().from("organizations").select("id");
  let fired = 0;
  for (const o of orgs ?? []) {
    try {
      fired += await runSlaSweep(o.id as string);
    } catch {
      /* per-org best effort */
    }
  }
  return Response.json({ ok: true, fired });
}
