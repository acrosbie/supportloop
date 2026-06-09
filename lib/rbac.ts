// Role-based access control. The single source of truth for "who can do what".
// An Actor's permissions derive from their org role (customer/agent/admin) plus,
// for agents, their role within their group (member/admin). Keep this pure (no
// server deps) so it's usable in middleware (edge), routes, and components.

export type Permission =
  | "kb.view"
  | "kb.create"
  | "kb.edit"
  | "kb.publish"
  | "kb.delete"
  | "tickets.view"
  | "tickets.reply"
  | "tickets.assign"
  | "ops.view"
  | "workflows.manage"
  | "customfields.manage"
  | "settings.manage"
  | "team.manage";

export const ALL_PERMISSIONS: Permission[] = [
  "kb.view",
  "kb.create",
  "kb.edit",
  "kb.publish",
  "kb.delete",
  "tickets.view",
  "tickets.reply",
  "tickets.assign",
  "ops.view",
  "workflows.manage",
  "customfields.manage",
  "settings.manage",
  "team.manage",
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "kb.view": "View knowledge base",
  "kb.create": "Create articles",
  "kb.edit": "Edit articles",
  "kb.publish": "Publish / unpublish articles",
  "kb.delete": "Delete articles",
  "tickets.view": "View tickets",
  "tickets.reply": "Reply to tickets",
  "tickets.assign": "Assign / triage tickets",
  "ops.view": "View ops (dashboard, insights, workflows)",
  "workflows.manage": "Manage workflows",
  "customfields.manage": "Manage custom fields",
  "settings.manage": "Manage workspace settings",
  "team.manage": "Manage team, groups & roles",
};

export type GroupRole = "member" | "admin";

export interface Actor {
  role: "customer" | "agent" | "admin";
  groupRole?: GroupRole | null;
}

// An agent (group member) works tickets and drafts KB. A group admin also
// publishes/deletes KB and manages ops automation. An org admin can do anything.
const AGENT_BASE: Permission[] = ["kb.view", "kb.create", "kb.edit", "tickets.view", "tickets.reply", "tickets.assign"];
const GROUP_ADMIN_EXTRA: Permission[] = ["kb.publish", "kb.delete", "ops.view", "workflows.manage", "customfields.manage"];

export function permissionsFor(actor: Actor): Set<Permission> {
  if (actor.role === "admin") return new Set(ALL_PERMISSIONS);
  if (actor.role === "agent") {
    const perms = [...AGENT_BASE];
    if (actor.groupRole === "admin") perms.push(...GROUP_ADMIN_EXTRA);
    return new Set(perms);
  }
  return new Set<Permission>(["kb.view"]); // customers
}

export function can(actor: Actor, perm: Permission): boolean {
  return permissionsFor(actor).has(perm);
}
