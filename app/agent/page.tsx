import SurfacePlaceholder from "@/components/SurfacePlaceholder";

export default function AgentPage() {
  return (
    <SurfacePlaceholder
      index="02"
      title="Agent Console"
      phase="Phase 1"
      summary="Where a human agent picks up escalated tickets — with AI doing the triage and drafting a grounded reply they can edit and send."
      capabilities={[
        "A queue of open and escalated tickets, seeded plus anything created from the help center",
        "AI triage: intent, urgency, and a suggested queue",
        "Customer sentiment detection",
        "A suggested reply grounded in retrieved KB, with the articles it used",
        "Edit, send, and resolve — resolving updates status and logs an event",
      ]}
    />
  );
}
