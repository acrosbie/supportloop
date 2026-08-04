import { describe, it, expect } from "vitest";
import { deflectionStats, formatDeflection } from "../deflection";

describe("deflectionStats", () => {
  it("divides by conversations, not tickets", () => {
    // 70 deflected, 30 escalated. Tickets = 30, conversations = 100.
    // Ticket-denominated would report 70/30 = 233%, which is why we don't.
    const s = deflectionStats({ deflected: 70, escalated: 30 });
    expect(s.conversations).toBe(100);
    expect(s.rate).toBeCloseTo(0.7);
  });

  it("stays bounded in [0,1] for any input", () => {
    for (const [d, e] of [
      [0, 100],
      [100, 0],
      [1, 1],
      [999, 1],
    ] as const) {
      const rate = deflectionStats({ deflected: d, escalated: e }).rate!;
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(1);
    }
  });

  it("returns null rather than 0 when nothing was measured", () => {
    const s = deflectionStats({ deflected: 0, escalated: 0 });
    expect(s.rate).toBeNull();
    expect(s.conversations).toBe(0);
  });

  it("reports 0 when every conversation escalated", () => {
    expect(deflectionStats({ deflected: 0, escalated: 12 }).rate).toBe(0);
  });

  it("reports 1 when every conversation deflected", () => {
    expect(deflectionStats({ deflected: 12, escalated: 0 }).rate).toBe(1);
  });

  it("moves monotonically as knowledge improves", () => {
    // Publishing an article converts escalations into deflections. The total
    // conversation count is unchanged, so the rate must rise, and only once.
    const before = deflectionStats({ deflected: 50, escalated: 50 }).rate!;
    const after = deflectionStats({ deflected: 60, escalated: 40 }).rate!;
    expect(after).toBeGreaterThan(before);
    expect(after).toBeCloseTo(0.6);
  });

  it("clamps negative counts instead of producing a nonsense rate", () => {
    const s = deflectionStats({ deflected: -5, escalated: 10 });
    expect(s.deflected).toBe(0);
    expect(s.rate).toBe(0);
  });
});

describe("formatDeflection", () => {
  it("renders no-data as an em space rather than 0%", () => {
    expect(formatDeflection(null)).toBe("—");
  });

  it("rounds to whole percent", () => {
    expect(formatDeflection(0.666)).toBe("67%");
    expect(formatDeflection(0)).toBe("0%");
    expect(formatDeflection(1)).toBe("100%");
  });
});
