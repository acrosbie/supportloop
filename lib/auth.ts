import { redirect } from "next/navigation";
import { createSupabaseServer } from "./supabase-server";
import type { Role } from "./demo-accounts";

export type { Role };

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
}

/** Current authenticated user (validated), or null. Safe in Server Components. */
export async function getAuth(): Promise<AuthUser | null> {
  const sb = createSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const role = ((user.app_metadata?.role as Role) || "customer") as Role;
  const name =
    (user.user_metadata?.display_name as string) || user.email?.split("@")[0] || "User";
  return { id: user.id, email: user.email || "", role, name };
}

/** Require one of `roles`, else redirect to login. Returns the user when allowed. */
export async function requireRole(roles: Role[]): Promise<AuthUser> {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!roles.includes(auth.role)) redirect("/login?denied=1");
  return auth;
}
