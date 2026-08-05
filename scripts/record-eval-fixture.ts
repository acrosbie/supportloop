/**
 * Records the vectors the CI eval gate replays.
 *
 *   npm run eval:record
 *
 * Embeds the golden questions with the live model and pulls the published KB
 * article embeddings out of Supabase, then writes them to a fixture. CI replays
 * that fixture instead of calling Voyage and Postgres on every push: no API key
 * in CI, no per-commit cost, and a red build means the retrieval *decision*
 * changed rather than that a network call was slow.
 *
 * Re-run this whenever the embedding model or the seeded KB changes, since the
 * frozen vectors are exactly what the gate cannot detect drifting. The diff is
 * meant to be reviewed: a large unexplained swing in the recorded similarities
 * is itself the signal.
 */
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";

config({ path: ".env.local" });

import { embed } from "../lib/embeddings";
import { supabaseAdmin } from "../lib/supabase";
import { getOrgIdBySlug, DEMO_ORG_SLUG } from "../lib/org";
import { SIMILARITY_THRESHOLD } from "../lib/guardrail";
import { gradeGoldenSet, type GoldenQuestion, type CorpusArticle } from "../lib/eval-core";
import questions from "../supabase/seed/eval-questions.json";

const OUT = path.join(process.cwd(), "lib", "__tests__", "fixtures", "eval-vectors.json");
/** Keeps the fixture reviewable in a diff; far finer than the threshold needs. */
const PRECISION = 6;

const round = (v: number[]): number[] => v.map((n) => Number(n.toFixed(PRECISION)));

async function main() {
  const qs = questions as GoldenQuestion[];
  const orgId = await getOrgIdBySlug(DEMO_ORG_SLUG);
  if (!orgId) throw new Error(`Org "${DEMO_ORG_SLUG}" not found — run npm run seed first.`);

  console.log(`Embedding ${qs.length} golden questions…`);
  const vectors = await embed(
    qs.map((q) => q.question),
    "query"
  );

  console.log("Reading published KB article embeddings…");
  const { data, error } = await supabaseAdmin()
    .from("kb_articles")
    .select("id,title,embedding")
    .eq("org_id", orgId)
    .eq("status", "published")
    .not("embedding", "is", null);
  if (error) throw new Error(`kb_articles: ${error.message}`);

  const corpus: CorpusArticle[] = (data ?? []).map((a) => ({
    id: a.id as string,
    title: a.title as string,
    // pgvector comes back as a JSON-ish string over PostgREST.
    embedding: round(typeof a.embedding === "string" ? JSON.parse(a.embedding) : (a.embedding as number[])),
  }));
  if (corpus.length === 0) throw new Error("No published articles with embeddings — run npm run seed first.");

  const fixture = {
    recordedAt: new Date().toISOString(),
    embeddingModel: "voyage-3-lite",
    dims: vectors[0]?.length ?? 0,
    threshold: SIMILARITY_THRESHOLD,
    questions: qs,
    questionVectors: vectors.map(round),
    corpus,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(fixture, null, 0)}\n`, "utf8");

  // Report what the gate will see, so a bad recording is obvious immediately
  // rather than as a confusing CI failure later.
  const summary = gradeGoldenSet(qs, fixture.questionVectors, corpus, SIMILARITY_THRESHOLD);
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  console.log("");
  console.log(`Wrote ${path.relative(process.cwd(), OUT)}`);
  console.log(`  ${corpus.length} articles · ${qs.length} questions · ${fixture.dims} dims`);
  console.log(`  pass rate      ${pct(summary.passRate)}  (${summary.passed}/${summary.total})`);
  console.log(`  answer split   ${summary.answer.passed}/${summary.answer.total}`);
  console.log(`  escalate split ${summary.escalate.passed}/${summary.escalate.total}`);
  console.log(`  avg similarity ${summary.avgSimilarity}`);
  const failures = summary.rows.filter((r) => !r.pass);
  if (failures.length) {
    console.log("");
    console.log("  Not passing at the current threshold:");
    for (const f of failures) {
      console.log(`    [${f.expected}] ${f.similarity.toFixed(3)}  ${f.question}`);
    }
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
