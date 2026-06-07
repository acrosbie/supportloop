import { getAuth } from "@/lib/auth";
import { DEMO_ACCOUNTS, SUPPORTLOOP_ACCOUNTS } from "@/lib/demo-accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEMO_EMAILS = new Set([...DEMO_ACCOUNTS, ...SUPPORTLOOP_ACCOUNTS].map((a) => a.email));

// The reviewer tour shows for anonymous visitors and the seeded demo accounts,
// but not for someone who has signed up their own workspace.
export async function GET() {
  const auth = await getAuth();
  const show = !auth || DEMO_EMAILS.has(auth.email);
  return Response.json({ show });
}
