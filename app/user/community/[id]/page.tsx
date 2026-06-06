import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommunityQuestion, getCommunityAnswers } from "@/lib/data";
import { resolveViewerOrgId } from "@/lib/org";
import CommunityThread from "@/components/customer/CommunityThread";

export const dynamic = "force-dynamic";

export default async function QuestionPage({ params }: { params: { id: string } }) {
  const orgId = await resolveViewerOrgId();
  const question = await getCommunityQuestion(orgId, params.id);
  if (!question) notFound();
  const answers = await getCommunityAnswers(orgId, params.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/user/community" className="text-sm text-accent-strong hover:underline">
        ← Community
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold">{question.title}</h1>
        {question.has_kb_gap && (
          <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
            Knowledge gap
          </span>
        )}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">{question.body}</p>

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
