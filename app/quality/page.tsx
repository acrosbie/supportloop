import SurfacePlaceholder from "@/components/SurfacePlaceholder";

export default function QualityPage() {
  return (
    <SurfacePlaceholder
      index="05"
      title="Quality / Evals"
      phase="Phase 2"
      summary="A small in-product eval harness — because measuring reply quality is the difference between a demo and a system you'd trust in production."
      capabilities={[
        "Runs ~20 golden questions through the real chat pipeline",
        "Grades each: was the answer grounded? did should-escalate questions escalate?",
        "Reports grounded-rate, pass-rate, and average retrieval similarity",
        "Stores each run so you can see quality over time",
      ]}
    />
  );
}
