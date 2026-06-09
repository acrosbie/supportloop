import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { updateOrgSettings, type OrgSettings } from "@/lib/org";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin updates per-org settings/branding.
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth || auth.role !== "admin" || !auth.orgId) {
    return Response.json({ ok: false, error: "Admin only" }, { status: 403 });
  }
  let settings: OrgSettings | undefined;
  try {
    ({ settings } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const patch: OrgSettings = {};
  if (typeof settings?.accent === "string") patch.accent = settings.accent.slice(0, 9);
  if (typeof settings?.tagline === "string") patch.tagline = settings.tagline.slice(0, 200);
  if (typeof settings?.threshold === "number") patch.threshold = Math.max(0.3, Math.min(0.85, settings.threshold));
  if (typeof settings?.domain === "string") patch.domain = settings.domain.trim().toLowerCase().slice(0, 120);
  if (typeof settings?.assistant === "boolean") patch.assistant = settings.assistant;
  if (typeof settings?.liveChat === "boolean") patch.liveChat = settings.liveChat;
  if (typeof settings?.community === "boolean") patch.community = settings.community;

  try {
    await updateOrgSettings(auth.orgId, patch);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
