import { getDashboardData, getInsightsData, getSlaSummary } from "@/lib/data";
import { getAuth, NO_ORG } from "@/lib/auth";
import DashboardView from "@/components/operator/DashboardView";
import InsightsPanel from "@/components/operator/InsightsPanel";
import SlaSummary from "@/components/operator/SlaSummary";

export const dynamic = "force-dynamic";

export default async function OpsDashboard() {
  const me = await getAuth();
  const orgId = me?.orgId ?? NO_ORG;
  const [data, insights, sla] = await Promise.all([
    getDashboardData(orgId),
    getInsightsData(orgId),
    getSlaSummary(orgId),
  ]);
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <DashboardView {...data} />
      <SlaSummary {...sla} />
      <InsightsPanel {...insights} />
    </div>
  );
}
