import { getLatestEvalRun } from "@/lib/data";
import EvalRunner, { type EvalSummary } from "@/components/operator/EvalRunner";

export const dynamic = "force-dynamic";

export default async function Quality() {
  const latest = await getLatestEvalRun();
  const initial: EvalSummary | null = latest
    ? {
        total: latest.total,
        grounded: latest.grounded,
        passed: latest.passed,
        avg_similarity: latest.avg_similarity,
        results: (latest.meta as { results?: EvalSummary["results"] })?.results ?? [],
        createdAt: latest.created_at,
      }
    : null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <EvalRunner initial={initial} />
    </div>
  );
}
