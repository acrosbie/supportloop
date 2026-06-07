import { NextRequest } from "next/server";
import { getStaffOrgId } from "@/lib/auth";
import { appendAgentReply } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Human approves the proposed agentic action — here, executing (mock) a refund
// and posting the customer reply.
export async function POST(req: NextRequest) {
  const orgId = await getStaffOrgId();
  if (!orgId) return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  let ticketId: string;
  let action: { tool: string; input: { amount?: number; invoice_id?: string } } | undefined;
  try {
    ({ ticketId, action } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  if (!ticketId || action?.tool !== "issue_refund") {
    return Response.json({ ok: false, error: "Nothing to approve" }, { status: 400 });
  }
  const amount = Number(action.input?.amount ?? 0).toFixed(2);
  const ref = action.input?.invoice_id ?? "—";
  const body = `Good news — I've issued a refund of $${amount} to your original payment method (ref ${ref}). It should appear within 5–10 business days. Sorry for the trouble, and thanks for your patience!`;
  try {
    await appendAgentReply(orgId, ticketId, body);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
