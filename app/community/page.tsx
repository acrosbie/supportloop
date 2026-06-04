import SurfacePlaceholder from "@/components/SurfacePlaceholder";

export default function CommunityPage() {
  return (
    <SurfacePlaceholder
      index="06"
      title="Community Q&A"
      phase="Phase 3"
      summary="A peer help forum where AI suggests answers from the KB — and where unanswered questions become a signal for what knowledge is missing."
      capabilities={[
        "List of community questions and answers, with accept and upvote",
        "AI-suggested answers grounded in the KB, with citations",
        "Weak retrieval flags a knowledge gap and creates a draft stub in the Knowledge Loop",
        "A 'Knowledge gaps' backlog that feeds Surface 3",
      ]}
    />
  );
}
