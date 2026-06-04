import { getResolvedTickets, getDraftArticles } from "@/lib/data";
import KnowledgeLoop from "@/components/agent/KnowledgeLoop";

export const dynamic = "force-dynamic";

export default async function KnowledgeLoopPage() {
  const [resolved, drafts] = await Promise.all([getResolvedTickets(10), getDraftArticles()]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Knowledge Loop</h1>
      <p className="mt-1 text-muted">Turn resolved tickets into reviewed, published knowledge.</p>

      <div className="mt-8">
        <KnowledgeLoop
          resolved={resolved.map((t) => ({ id: t.id, subject: t.subject, intent: t.intent }))}
          drafts={drafts.map((d) => ({ id: d.id, title: d.title, body: d.body, category: d.category }))}
        />
      </div>
    </div>
  );
}
