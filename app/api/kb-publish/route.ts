import { NextRequest } from "next/server";
import { publishArticle } from "@/lib/data";
import { getStaffOrgId } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Publish a draft KB article: embed it, flip to published, log kb_publish.
// After this it immediately improves chatbot + agent-assist retrieval.
export async function POST(req: NextRequest) {
  let articleId: string;
  try {
    ({ articleId } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!articleId) return Response.json({ error: "articleId required" }, { status: 400 });
  const orgId = await getStaffOrgId();
  if (!orgId) return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    await publishArticle(orgId, articleId);
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Publish failed";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
