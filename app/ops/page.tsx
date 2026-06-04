import { getDashboardData } from "@/lib/data";
import DashboardView from "@/components/operator/DashboardView";

export const dynamic = "force-dynamic";

export default async function OpsDashboard() {
  const data = await getDashboardData();
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <DashboardView {...data} />
    </div>
  );
}
