import Link from "next/link";
import { MessageSquare, MessageCircle, CheckCircle2 } from "lucide-react";
import { getCommunityQuestions } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function StatePill({ hasGap, status }: { hasGap: boolean; status: string }) {
  if (hasGap) return <Badge tone="warning">Knowledge gap</Badge>;
  if (status === "answered") return <Badge tone="success">Answered</Badge>;
  return <Badge tone="neutral">Open</Badge>;
}

export default async function Community() {
  const questions = await getCommunityQuestions();
  const gaps = questions.filter((q) => q.has_kb_gap);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Community</h1>
        <p className="mt-1 text-muted">Ask the community — and let AI suggest answers from the help center.</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          {questions.map((q) => (
            <Link
              key={q.id}
              href={`/user/community/${q.id}`}
              className="flex gap-3 rounded-xl border border-border bg-white p-4 transition-colors hover:border-accent"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                <MessageSquare className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium">{q.title}</div>
                  <StatePill hasGap={q.has_kb_gap} status={q.status} />
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-muted">{q.body}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {q.answerCount} answer{q.answerCount === 1 ? "" : "s"}
                  </span>
                  {q.status === "answered" && (
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-3 w-3" />
                      resolved
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div>
          <div className="rounded-xl border border-warning/30 bg-warning-soft p-5">
            <div className="font-medium text-warning">Knowledge gaps</div>
            <p className="mt-1 text-sm text-warning/90">
              Questions the KB can't answer well. Each becomes a draft article in the Agent → Knowledge Loop.
            </p>
            <ul className="mt-3 space-y-2">
              {gaps.map((g) => (
                <li key={g.id} className="text-sm text-warning">
                  •{" "}
                  <Link href={`/user/community/${g.id}`} className="hover:underline">
                    {g.title}
                  </Link>
                </li>
              ))}
              {gaps.length === 0 && <li className="text-sm text-warning/90">No gaps flagged yet.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
