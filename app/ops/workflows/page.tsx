import { getAuth, NO_ORG } from "@/lib/auth";
import { listWorkflows, getRecentWorkflowRuns } from "@/lib/workflows";
import WorkflowsView from "@/components/operator/WorkflowsView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Workflows" };

export default async function WorkflowsPage() {
  const me = await getAuth();
  const orgId = me?.orgId ?? NO_ORG;
  const [workflows, runs] = await Promise.all([listWorkflows(orgId), getRecentWorkflowRuns(orgId)]);
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <WorkflowsView
        workflows={workflows.map((w) => ({
          id: w.id,
          name: w.name,
          trigger: w.trigger,
          enabled: w.enabled,
          steps: w.steps,
          runCount: w.runCount,
          lastRunAt: w.lastRunAt,
        }))}
        runs={runs}
      />
    </div>
  );
}
