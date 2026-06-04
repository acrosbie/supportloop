import Link from "next/link";
import { getCommunityQuestions } from "@/lib/data";

export const dynamic = "force-dynamic";

function StatePill({ hasGap, status }: { hasGap: boolean; status: string }) {
  if (hasGap)
    return <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Knowledge gap</span>;
  if (status === "answered")
    return <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700">Answered</span>;
  return <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted">Open</span>;
}

export default async function Community() {
  const questions = await getCommunityQuestions();
  const gaps = questions.filter((q) => q.has_kb_gap);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Community</h1>
        <p className="mt-1 text-muted">Ask the community — and let AI suggest answers from the help center.</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="divide-y divide-border rounded-xl border border-border bg-white">
            {questions.map((q) => (
              <li key={q.id}>
                <Link href={`/user/community/${q.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-surface-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{q.title}</div>
                    <div className="mt-1 text-xs text-muted">
                      {q.answerCount} answer{q.answerCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <StatePill hasGap={q.has_kb_gap} status={q.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="font-medium text-amber-800">Knowledge gaps</div>
            <p className="mt-1 text-sm text-amber-700">
              Questions the KB can't answer well. Each becomes a draft article in the Agent → Knowledge Loop.
            </p>
            <ul className="mt-3 space-y-2">
              {gaps.map((g) => (
                <li key={g.id} className="text-sm text-amber-900">
                  •{" "}
                  <Link href={`/user/community/${g.id}`} className="hover:underline">
                    {g.title}
                  </Link>
                </li>
              ))}
              {gaps.length === 0 && <li className="text-sm text-amber-700">No gaps flagged yet.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
