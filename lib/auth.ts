import { redirect } from "next/navigation";
import { createSupabaseServer } from "./supabase-server";
import type { Role } from "./demo-accounts";
import { can, type Permission, type GroupRole } from "./rbac";

export type { Role };

/**
 * Sentinel org id for "authenticated but no org on the JWT" — e.g. a session
 * minted before tenancy existed. It's a valid UUID that matches no rows, so
 * org-scoped queries return empty instead of throwing on an invalid uuid.
 * Re-authenticating mints a fresh token carrying the real org_id.
 */
export const NO_ORG = "00000000-0000-0000-0000-000000000000";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
  orgId: string | null;
  groupId: string | null;
  groupRole: GroupRole | null;
}

/** Current authenticated user (validated), or null. Safe in Server Components. */
export async function getAuth(): Promise<AuthUser | null> {
  const sb = createSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const role = ((user.app_metadata?.role as Role) || "customer") as Role;
  const name = (user.user_metadata?.display_name as string) || user.email?.split("@")[0] || "User";
  const orgId = (user.app_metadata?.org_id as string) || null;
  const groupId = (user.app_metadata?.group_id as string) || null;
  const groupRole = (user.app_metadata?.group_role as GroupRole) || null;
  return { id: user.id, email: user.email || "", role, name, orgId, groupId, groupRole };
}

/** Require one of `roles`, else redirect to login. Returns the user when allowed. */
export async function requireRole(roles: Role[]): Promise<AuthUser> {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!roles.includes(auth.role)) redirect("/login?denied=1");
  return auth;
}

/** Require a permission, else redirect. Returns the user when allowed. */
export async function requirePermission(perm: Permission): Promise<AuthUser> {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!can({ role: auth.role, groupRole: auth.groupRole }, perm)) redirect("/login?denied=1");
  return auth;
}

/** For API route handlers: the org id of an authenticated agent/admin, or null. */
export async function getStaffOrgId(): Promise<string | null> {
  const auth = await getAuth();
  if (!auth || (auth.role !== "agent" && auth.role !== "admin") || !auth.orgId) return null;
  return auth.orgId;
}

/** For API routes: the org id if the authenticated actor has `perm`, else null. */
export async function orgIdWithPermission(perm: Permission): Promise<string | null> {
  const auth = await getAuth();
  if (!auth || !auth.orgId) return null;
  if (!can({ role: auth.role, groupRole: auth.groupRole }, perm)) return null;
  return auth.orgId;
}
