import SurfacePlaceholder from "@/components/SurfacePlaceholder";

export default function DashboardPage() {
  return (
    <SurfacePlaceholder
      index="04"
      title="Ops Dashboard"
      phase="Phase 2"
      summary="The operator's view — the metrics that prove the AI moved a business outcome, not just that it shipped. This is the differentiator."
      capabilities={[
        "Deflection rate: share of tickets resolved without an agent",
        "Automation / AI-assist rate and average CSAT",
        "Ticket volume over time and top intents",
        "KB articles published from tickets",
        "A today / this-session lens so your own actions register live",
      ]}
    />
  );
}
