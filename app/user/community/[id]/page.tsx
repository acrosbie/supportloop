import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommunityQuestion, getCommunityAnswers } from "@/lib/data";
import { resolveViewerOrgId } from "@/lib/org";
import { personaName } from "@/lib/people";
import { timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import CommunityThread from "@/components/customer/CommunityThread";

export const dynamic = "force-dynamic";

export default async function QuestionPage({ params }: { params: { id: string } }) {
  const orgId = await resolveViewerOrgId();
  const question = await getCommunityQuestion(orgId, params.id);
  if (!question) notFound();
  const answers = await getCommunityAnswers(orgId, params.id);
  const author = personaName(question.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/user/community" className="text-sm text-accent-strong hover:underline">
        ← Community
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{question.title}</h1>
        {question.status === "answered" && <Badge tone="success">Solved</Badge>}
      </div>

      <div className="mt-5 flex gap-3">
        <Avatar name={author} className="h-9 w-9 shrink-0 text-xs" />
        <div className="min-w-0 flex-1">
          <div className="text-sm">
            <span className="font-medium">{author}</span>
            <span className="text-muted"> · {timeAgo(question.created_at)}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">{question.body}</p>
        </div>
      </div>

      <CommunityThread
        questionId={question.id}
        answers={answers.map((a) => ({
          id: a.id,
          body: a.body,
          source: a.source,
          accepted: a.accepted,
          upvotes: a.upvotes,
        }))}
      />
    </div>
  );
}
