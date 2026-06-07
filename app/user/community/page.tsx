import Link from "next/link";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import { getCommunityQuestions } from "@/lib/data";
import { resolveViewerOrgId } from "@/lib/org";
import { personaName } from "@/lib/people";
import { timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function Community() {
  const orgId = await resolveViewerOrgId();
  const questions = await getCommunityQuestions(orgId);
  const solved = questions.filter((q) => q.status === "answered").length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Community</h1>
          <p className="mt-1 text-muted">Get help from other Orbit users and our support team.</p>
        </div>
        <Button asChild>
          <Link href="/user/community/new">Ask a question</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
            {questions.map((q) => {
              const author = personaName(q.id);
              return (
                <li key={q.id}>
                  <Link href={`/user/community/${q.id}`} className="flex gap-3 px-5 py-4 transition-colors hover:bg-surface-2">
                    <Avatar name={author} className="h-9 w-9 shrink-0 text-xs" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium">{q.title}</div>
                        {q.status === "answered" ? <Badge tone="success">Solved</Badge> : <Badge tone="neutral">Open</Badge>}
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-muted">{q.body}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                        <span className="font-medium text-foreground/70">{author}</span>
                        <span>·</span>
                        <span>{timeAgo(q.created_at)}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {q.answerCount} {q.answerCount === 1 ? "reply" : "replies"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
            {questions.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-muted">No questions yet — be the first to ask.</li>
            )}
          </ul>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="font-medium">About the community</div>
            <p className="mt-1.5 text-sm text-muted">
              Ask questions, share tips, and get answers from other Orbit users and our team. Our assistant also suggests
              answers from the help center.
            </p>
            <Button asChild className="mt-4 w-full">
              <Link href="/user/community/new">Ask a question</Link>
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="text-xs font-medium uppercase tracking-widest text-muted">This week</div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted">Questions</span>
              <span className="font-medium">{questions.length}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Solved
              </span>
              <span className="font-medium">{solved}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
