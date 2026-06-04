import { NextRequest } from "next/server";
import { acceptAnswer, upvoteAnswer } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accept or upvote a community answer.
export async function POST(req: NextRequest) {
  let answerId: string;
  let action: string;
  try {
    ({ answerId, action } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!answerId || !action) return Response.json({ error: "answerId and action required" }, { status: 400 });
  try {
    if (action === "accept") {
      await acceptAnswer(answerId);
      return Response.json({ ok: true });
    }
    if (action === "upvote") {
      const upvotes = await upvoteAnswer(answerId);
      return Response.json({ ok: true, upvotes });
    }
    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Action failed";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
