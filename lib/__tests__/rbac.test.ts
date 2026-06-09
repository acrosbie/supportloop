import { describe, it, expect } from "vitest";
import { can } from "../rbac";

describe("rbac permissions", () => {
  it("org admin can do everything", () => {
    expect(can({ role: "admin" }, "settings.manage")).toBe(true);
    expect(can({ role: "admin" }, "team.manage")).toBe(true);
    expect(can({ role: "admin" }, "kb.delete")).toBe(true);
  });

  it("group-admin agent publishes KB + sees ops, but not org settings/team", () => {
    const a = { role: "agent" as const, groupRole: "admin" as const };
    expect(can(a, "kb.publish")).toBe(true);
    expect(can(a, "kb.delete")).toBe(true);
    expect(can(a, "ops.view")).toBe(true);
    expect(can(a, "workflows.manage")).toBe(true);
    expect(can(a, "settings.manage")).toBe(false);
    expect(can(a, "team.manage")).toBe(false);
  });

  it("group-member agent drafts KB + works tickets, but can't publish or see ops", () => {
    const a = { role: "agent" as const, groupRole: "member" as const };
    expect(can(a, "kb.create")).toBe(true);
    expect(can(a, "tickets.reply")).toBe(true);
    expect(can(a, "kb.publish")).toBe(false);
    expect(can(a, "ops.view")).toBe(false);
    expect(can(a, "customfields.manage")).toBe(false);
  });

  it("customers can only view KB", () => {
    expect(can({ role: "customer" }, "kb.view")).toBe(true);
    expect(can({ role: "customer" }, "kb.create")).toBe(false);
    expect(can({ role: "customer" }, "tickets.view")).toBe(false);
  });
});
