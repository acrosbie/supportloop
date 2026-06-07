import { NextRequest } from "next/server";
import { createCommunityQuestion } from "@/lib/data";
import { resolveViewerOrgId } from "@/lib/org";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

// Post a new community question into the viewer's workspace.
export async function POST(req: NextRequest) {
  let title: string;
  let body: string;
  try {
    ({ title, body } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!title?.trim() || !body?.trim()) {
    return Response.json({ error: "Add a title and some details" }, { status: 400 });
  }
  try {
    const orgId = await resolveViewerOrgId();
    const id = await createCommunityQuestion(orgId, title.trim(), body.trim());
    return Response.json({ ok: true, id });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed to post" }, { status: 500 });
  }
}
