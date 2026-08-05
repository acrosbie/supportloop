import { describe, it, expect } from "vitest";
import { SIMILARITY_THRESHOLD } from "../guardrail";
import { gradeGoldenSet, type GoldenQuestion, type CorpusArticle } from "../eval-core";
import fixture from "./fixtures/eval-vectors.json";

/**
 * The regression gate. Runs on every push (npm run eval, wired into CI) against
 * vectors recorded by scripts/record-eval-fixture.ts, so it needs no API keys
 * and returns the same answer every time.
 *
 * Floors are set at the behaviour recorded on 2026-08-04, not at aspirational
 * numbers. A gate exists to catch a change for the worse; setting it above what
 * the system currently does just means a red build nobody trusts.
 */

/** Uncovered questions must NEVER ground. This is the guardrail's whole job:
 *  below threshold the surface escalates instead of inventing policy. Any
 *  regression here ships a system that answers billing and security questions
 *  it has no source for, so it is the one number with no tolerance. */
const ESCALATE_MUST_ALL_PASS = true;

/** Covered questions that currently ground. Two of twelve do not (see the
 *  documented gaps below), so the floor is 10, not 12. */
const MIN_ANSWER_PASSES = 10;

/** Overall floor, a little under the recorded 90% so ordinary noise in a
 *  re-record does not fail the build on its own. */
const MIN_PASS_RATE = 0.85;

const summary = gradeGoldenSet(
  fixture.questions as GoldenQuestion[],
  fixture.questionVectors as number[][],
  fixture.corpus as CorpusArticle[],
  SIMILARITY_THRESHOLD
);

describe("eval gate: grounding decisions", () => {
  it("never grounds a question the knowledge base does not cover", () => {
    const leaked = summary.rows.filter((r) => r.expected === "escalate" && r.grounded);
    // Named in the failure message: which question started inventing an answer
    // is the first thing you need, and a bare count does not tell you.
    expect(leaked.map((r) => `${r.question} (${r.similarity})`)).toEqual([]);
    expect(ESCALATE_MUST_ALL_PASS && summary.escalate.passed).toBe(summary.escalate.total);
  });

  it("still answers the covered questions it used to answer", () => {
    expect(summary.answer.passed).toBeGreaterThanOrEqual(MIN_ANSWER_PASSES);
  });

  it("holds the overall pass rate", () => {
    expect(summary.passRate).toBeGreaterThanOrEqual(MIN_PASS_RATE);
  });
});

describe("eval gate: fixture integrity", () => {
  it("was recorded against the threshold the app actually ships", () => {
    // Catches a threshold edited in guardrail.ts without a re-record, which
    // would otherwise make the gate grade against a world that no longer exists.
    expect(fixture.threshold).toBe(SIMILARITY_THRESHOLD);
  });

  it("has a vector for every golden question", () => {
    expect(fixture.questionVectors).toHaveLength(fixture.questions.length);
    for (const v of fixture.questionVectors) expect(v).toHaveLength(fixture.dims);
  });

  it("has a non-trivial corpus", () => {
    expect(fixture.corpus.length).toBeGreaterThanOrEqual(10);
    for (const a of fixture.corpus) expect(a.embedding).toHaveLength(fixture.dims);
  });
});

describe("eval gate: known gaps", () => {
  /**
   * These two are labelled "answer" in the golden set but do not ground: the
   * seeded KB has no article covering refund windows or self-serve plan
   * changes. The harness found them the first time it ran, which is the point
   * of having one.
   *
   * They are asserted rather than deleted so the gap stays visible and so
   * closing it (by writing the articles) fails this test loudly instead of
   * passing silently.
   */
  const KNOWN_GAPS = [
    "Can I get a refund within two weeks of upgrading?",
    "How do I change from Pro to Business?",
  ];

  it("still has exactly the documented coverage gaps, no more and no fewer", () => {
    const failing = summary.rows
      .filter((r) => r.expected === "answer" && !r.grounded)
      .map((r) => r.question)
      .sort();
    expect(failing).toEqual([...KNOWN_GAPS].sort());
  });
});
