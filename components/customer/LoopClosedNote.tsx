import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { loopClosedSource, minutesSince, type GroundedSource } from "@/lib/grounded-stream";

/**
 * The payoff moment, made visible.
 *
 * The product's central claim is that a resolved ticket becomes knowledge that
 * deflects the next identical question. Completing that sequence used to look
 * like any other answer — the article silently entered retrieval and the
 * customer saw nothing. This says so, and says it most emphatically when the
 * article was published minutes ago, which is exactly the case while someone is
 * walking the demo.
 *
 * Renders nothing unless a cited article actually came from a ticket, so it
 * never fires on seeded content and cannot become decoration.
 */
export default function LoopClosedNote({
  sources,
  articleBase,
  agentView = false,
}: {
  sources: GroundedSource[];
  /** Route prefix for article links, e.g. "/user/article" or "/help/orbit/article". */
  articleBase: string;
  /** Staff surfaces can link back to the originating ticket; customers cannot. */
  agentView?: boolean;
}) {
  const source = loopClosedSource(sources);
  if (!source) return null;

  const mins = minutesSince(source.origin?.publishedAt);
  const fresh = mins !== null && mins < 60;

  return (
    <div className="mt-2 flex gap-2 rounded-lg border border-success/30 bg-success-soft/50 px-2.5 py-2">
      <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
      <div className="text-[11px] leading-relaxed text-foreground/80">
        <span className="font-medium text-foreground">The loop closed.</span>{" "}
        {fresh ? (
          <>
            This answer came from an article published{" "}
            {mins === 0 ? "moments ago" : `${mins} minute${mins === 1 ? "" : "s"} ago`} from a resolved ticket.
          </>
        ) : (
          <>This answer came from an article written from a resolved ticket.</>
        )}{" "}
        <Link href={`${articleBase}/${source.id}`} className="font-medium text-accent-strong hover:underline">
          {source.title}
        </Link>
        {agentView && source.origin?.ticketId && (
          <>
            {" · "}
            <Link
              href={`/agent/ticket/${source.origin.ticketId}`}
              className="font-medium text-accent-strong hover:underline"
            >
              see the ticket
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
