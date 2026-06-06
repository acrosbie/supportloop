import { getDashboardData } from "@/lib/data";
import { getAuth } from "@/lib/auth";
import DashboardView from "@/components/operator/DashboardView";

export const dynamic = "force-dynamic";

export default async function OpsDashboard() {
  const me = await getAuth();
  const data = await getDashboardData(me?.orgId ?? "");
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <DashboardView {...data} />
    </div>
  );
}
