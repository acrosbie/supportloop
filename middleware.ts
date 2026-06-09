import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { can, type Actor } from "@/lib/rbac";

// Refreshes the Supabase session on every request and gates the operator areas
// (/agent, /ops) by role. Role lives in the JWT (app_metadata.role).
export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  const isOperator = path.startsWith("/agent") || path.startsWith("/ops");

  if (isOperator) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    const role = (user.app_metadata?.role as string) || "customer";
    const groupRole = (user.app_metadata?.group_role as "member" | "admin" | null) || null;
    const actor: Actor = { role: role as Actor["role"], groupRole };
    let allowed: boolean;
    if (path.startsWith("/ops/admin")) allowed = can(actor, "settings.manage");
    else if (path.startsWith("/ops")) allowed = can(actor, "ops.view");
    else allowed = role === "agent" || role === "admin"; // /agent — any agent or admin
    if (!allowed) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("denied", "1");
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)).*)"],
};
