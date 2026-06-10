import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { runSlaSweep } from "@/lib/workflows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Scheduled SLA breach sweep across all orgs (wired via vercel.json cron). If
// CRON_SECRET is set, Vercel sends it as a Bearer token — enforce it.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
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
