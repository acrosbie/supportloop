import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { setTicketCsat } from "@/lib/data";
import { runCsatSubmitted } from "@/lib/workflows";
import { runInBackground } from "@/lib/async-run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// A signed-in customer rates one of their resolved tickets.
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth || !auth.orgId) return Response.json({ ok: false, error: "Sign in to rate" }, { status: 401 });
  let ticketId: string;
  let score: number;
  try {
    ({ ticketId, score } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  if (!ticketId || typeof score !== "number") {
    return Response.json({ ok: false, error: "ticketId and score required" }, { status: 400 });
  }
  try {
    await setTicketCsat(auth.orgId, ticketId, auth.id, score);
    // Fire csat.submitted workflows (low-CSAT recovery / happy-customer) in the background.
    runInBackground(() => runCsatSubmitted(auth.orgId as string, ticketId));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
