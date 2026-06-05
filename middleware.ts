import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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
    const role = user.app_metadata?.role as string | undefined;
    const allowed = role === "agent" || role === "admin";
    const adminOnly = path.startsWith("/ops/admin");
    if (!allowed || (adminOnly && role !== "admin")) {
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
