import { describe, it, expect } from "vitest";
import {
  parseGroundingHeader,
  loopClosedSource,
  minutesSince,
  type GroundedSource,
} from "../grounded-stream";

const src = (id: string, source?: string, publishedAt?: string): GroundedSource => ({
  id,
  title: `Article ${id}`,
  similarity: 0.7,
  origin: source ? { source, ticketId: source === "ticket" ? "t-1" : null, publishedAt: publishedAt ?? null } : null,
});

describe("parseGroundingHeader", () => {
  it("parses a well-formed header", () => {
    const m = parseGroundingHeader(JSON.stringify({ grounded: true, topSimilarity: 0.72, sources: [src("a")] }));
    expect(m.grounded).toBe(true);
    expect(m.topSimilarity).toBeCloseTo(0.72);
    expect(m.sources).toHaveLength(1);
  });

  it("falls back to an empty decision when the header is absent", () => {
    const m = parseGroundingHeader(null);
    expect(m.grounded).toBe(false);
    expect(m.sources).toEqual([]);
  });

  it("does not throw on malformed JSON", () => {
    // Metadata is an enhancement; a broken header must not break the answer.
    expect(parseGroundingHeader("{not json").grounded).toBe(false);
  });

  it("coerces missing or wrong-typed fields", () => {
    const m = parseGroundingHeader(JSON.stringify({ topSimilarity: "high", sources: "none" }));
    expect(m.grounded).toBe(false);
    expect(m.topSimilarity).toBe(0);
    expect(m.sources).toEqual([]);
  });
});

describe("loopClosedSource", () => {
  it("finds the first ticket-derived article", () => {
    const found = loopClosedSource([src("a", "seed"), src("b", "ticket"), src("c", "ticket")]);
    expect(found?.id).toBe("b");
  });

  it("returns null when every citation is seeded", () => {
    expect(loopClosedSource([src("a", "seed"), src("b", "community")])).toBeNull();
  });

  it("returns null when provenance is missing entirely", () => {
    // Surfaces that don't send origin must not render the loop callout.
    expect(loopClosedSource([src("a")])).toBeNull();
  });

  it("handles an empty citation list", () => {
    expect(loopClosedSource([])).toBeNull();
  });
});

describe("minutesSince", () => {
  it("returns whole minutes elapsed", () => {
    expect(minutesSince(new Date(Date.now() - 5 * 60_000).toISOString())).toBe(5);
  });

  it("floors to 0 for something just published", () => {
    expect(minutesSince(new Date().toISOString())).toBe(0);
  });

  it("never returns a negative for a future timestamp", () => {
    // Clock skew between the DB and the browser shouldn't render "-3 minutes ago".
    expect(minutesSince(new Date(Date.now() + 60_000).toISOString())).toBe(0);
  });

  it("returns null for absent or unparseable input", () => {
    expect(minutesSince(null)).toBeNull();
    expect(minutesSince(undefined)).toBeNull();
    expect(minutesSince("not a date")).toBeNull();
  });
});
