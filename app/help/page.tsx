import SurfacePlaceholder from "@/components/SurfacePlaceholder";

export default function HelpPage() {
  return (
    <SurfacePlaceholder
      index="01"
      title="Customer Help Center + AI Chatbot"
      phase="Phase 1"
      summary="The customer-facing front door: searchable help articles plus a chatbot that answers from the knowledge base — or escalates cleanly when it can't."
      capabilities={[
        "Searchable, readable list of published Orbit help articles",
        "A chat widget that retrieves top-K KB articles and streams a grounded answer",
        "Clickable citation chips and a visible retrieval-confidence score",
        "When confidence is below threshold: apologize and create a ticket (escalate)",
        "Logs a deflection or escalation event that feeds the ops dashboard",
      ]}
    />
  );
}
