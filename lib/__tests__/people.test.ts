import { describe, it, expect } from "vitest";
import { personaName } from "../people";

describe("personaName", () => {
  it("is deterministic for a given seed", () => {
    expect(personaName("ticket-abc")).toBe(personaName("ticket-abc"));
  });

  it("varies across seeds", () => {
    expect(personaName("ticket-abc")).not.toBe(personaName("ticket-xyz"));
  });

  it("formats as 'First L.'", () => {
    expect(personaName("seed-1")).toMatch(/^[A-Z][a-z]+ [A-Z]\.$/);
  });
});
