import { getLatestEvalRun } from "@/lib/data";
import { getAuth, NO_ORG } from "@/lib/auth";
import EvalRunner, { type EvalSummary } from "@/components/operator/EvalRunner";

export const dynamic = "force-dynamic";

export default async function Quality() {
  const me = await getAuth();
  const latest = await getLatestEvalRun(me?.orgId ?? NO_ORG);
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
