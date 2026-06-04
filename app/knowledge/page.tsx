import SurfacePlaceholder from "@/components/SurfacePlaceholder";

export default function KnowledgePage() {
  return (
    <SurfacePlaceholder
      index="03"
      title="Knowledge Loop"
      phase="Phase 2"
      summary="The part that closes the loop: turn resolved tickets and community gaps into new knowledge-base articles, reviewed by a human before publishing."
      capabilities={[
        "Lists recently resolved tickets and community knowledge gaps",
        "AI drafts a {title, body, category, tags} article from the conversation",
        "Drafts land in a review queue — nothing publishes unreviewed",
        "Publishing embeds the article so it immediately improves future retrieval",
        "Logs a kb_publish event for the dashboard",
      ]}
    />
  );
}
