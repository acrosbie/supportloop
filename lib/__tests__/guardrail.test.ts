import { describe, it, expect } from "vitest";
import { decideGrounding } from "../guardrail";
import type { KbMatch } from "../retrieve";

const m = (similarity: number): KbMatch => ({
  id: "x",
  title: "t",
  body: "b",
  category: "c",
  tags: [],
  similarity,
});

describe("decideGrounding", () => {
  it("grounds when the top similarity is at/above threshold", () => {
    const d = decideGrounding([m(0.7), m(0.5)], 0.6);
    expect(d.grounded).toBe(true);
    // Only matches at/above threshold are cited.
    expect(d.sources).toHaveLength(1);
    expect(d.topSimilarity).toBe(0.7);
  });

  it("escalates below threshold with no sources", () => {
    const d = decideGrounding([m(0.55)], 0.6);
    expect(d.grounded).toBe(false);
    expect(d.sources).toHaveLength(0);
  });

  it("treats exactly-at-threshold as grounded", () => {
    expect(decideGrounding([m(0.6)], 0.6).grounded).toBe(true);
  });

  it("handles empty matches", () => {
    const d = decideGrounding([], 0.6);
    expect(d.grounded).toBe(false);
    expect(d.topSimilarity).toBe(0);
  });
});
