import { getDashboardData, getInsightsData } from "@/lib/data";
import { getAuth, NO_ORG } from "@/lib/auth";
import DashboardView from "@/components/operator/DashboardView";
import InsightsPanel from "@/components/operator/InsightsPanel";

export const dynamic = "force-dynamic";

export default async function OpsDashboard() {
  const me = await getAuth();
  const orgId = me?.orgId ?? NO_ORG;
  const [data, insights] = await Promise.all([getDashboardData(orgId), getInsightsData(orgId)]);
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <DashboardView {...data} />
      <InsightsPanel {...insights} />
    </div>
  );
}
