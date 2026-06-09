import { CheckCircle2, Sparkles, Eye, BookOpen, ArrowRight } from "lucide-react";
import { getResolvedTickets, getDraftArticles } from "@/lib/data";
import { getAuth, NO_ORG } from "@/lib/auth";
import { can } from "@/lib/rbac";
import KnowledgeLoop from "@/components/agent/KnowledgeLoop";

export const dynamic = "force-dynamic";

const FLOW = [
  { icon: CheckCircle2, label: "Resolved ticket" },
  { icon: Sparkles, label: "AI draft" },
  { icon: Eye, label: "Human review" },
  { icon: BookOpen, label: "Published → improves retrieval" },
];

export default async function KnowledgeLoopPage() {
  const me = await getAuth();
  const orgId = me?.orgId ?? NO_ORG;
  const canPublish = can({ role: me?.role ?? "customer", groupRole: me?.groupRole ?? null }, "kb.publish");
  const [resolved, drafts] = await Promise.all([getResolvedTickets(orgId, 10), getDraftArticles(orgId)]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Knowledge Loop</h1>
      <p className="mt-1 text-muted">Turn resolved tickets into reviewed, published knowledge.</p>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted">
        {FLOW.map((s, i) => {
          const Icon = s.icon;
          return (
            <span key={s.label} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="h-3.5 w-3.5" />}
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1">
                <Icon className="h-3.5 w-3.5 text-accent-strong" />
                {s.label}
              </span>
            </span>
          );
        })}
      </div>

      <div className="mt-8">
        <KnowledgeLoop
          canPublish={canPublish}
          resolved={resolved.map((t) => ({ id: t.id, subject: t.subject, intent: t.intent }))}
          drafts={drafts.map((d) => ({ id: d.id, title: d.title, body: d.body, category: d.category }))}
        />
      </div>
    </div>
  );
}
