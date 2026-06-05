import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { updateArticle, unpublishArticle, deleteArticle, publishArticle } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Admin KB management: update (re-embeds if published), publish, unpublish, delete.
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth || auth.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
  let action: string;
  let id: string;
  let fields: { title?: string; body?: string; category?: string; tags?: string[] } | undefined;
  try {
    ({ action, id, fields } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!action || !id) return Response.json({ error: "action and id required" }, { status: 400 });
  try {
    if (action === "update") await updateArticle(id, fields ?? {});
    else if (action === "publish") await publishArticle(id);
    else if (action === "unpublish") await unpublishArticle(id);
    else if (action === "delete") await deleteArticle(id);
    else return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
