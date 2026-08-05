// Deflection accounting.
//
// A conversation with the assistant ends exactly one of two ways: the assistant
// answered it from the knowledge base and no human was involved (deflected), or
// it became a ticket for a human (escalated). The deflection rate is the share
// that ended the first way.
//
// The denominator is the whole game here, and it is where most reported
// deflection numbers quietly go wrong:
//
//   deflected / tickets        <- flattering, and structurally misleading
//   deflected / conversations  <- what this computes
//
// A deflected question never becomes a ticket. Dividing deflections by ticket
// count therefore divides by a denominator that excludes most of the numerator,
// which inflates the number and, worse, makes it move the wrong way: publish a
// great article, deflect more questions, open fewer tickets, and a
// ticket-denominated rate climbs for two independent reasons at once. It cannot
// be compared across time periods or against another team's number.
//
// Counting over conversations keeps the metric bounded in [0, 1] and gives it a
// single, honest interpretation: of everyone who asked, this fraction got an
// answer without a human.

/**
 * How long after a deflection a ticket from the same session still counts as
 * that conversation coming back, rather than as a new question. Four hours is a
 * judgement call, not a discovered constant: long enough to catch "tried the
 * article, it didn't work, gave up", short enough that tomorrow's unrelated
 * question isn't blamed on today's answer. It belongs in the open where it can
 * be argued with.
 */
export const REVERT_WINDOW_HOURS = 4;

export interface ConversationCounts {
  /** Conversations the assistant answered from the KB, no human involved. */
  deflected: number;
  /** Conversations that became a ticket (from chat or live chat). */
  escalated: number;
  /**
   * Deflections whose session opened a ticket inside the revert window. These
   * were never deflections; they were delays. Counted separately because the
   * same conversation produced both events, so it must not be counted twice.
   */
  reverted?: number;
}

export interface DeflectionStats {
  deflected: number;
  escalated: number;
  reverted: number;
  /** Distinct conversations, after collapsing deflect-then-escalate pairs. */
  conversations: number;
  /**
   * The reported rate: deflections that stuck, over distinct conversations.
   * Null rather than 0 when nothing was measured, because "nobody asked" is not
   * "we deflected nothing", and rendering an unmeasured period as 0% is its own
   * small lie.
   */
  rate: number | null;
  /**
   * What the rate would be without the revert window: every deflection event
   * treated as a win and counted as its own conversation. Kept so the dashboard
   * can show the gap rather than quietly reporting the better number.
   */
  naiveRate: number | null;
}

/**
 * A session that deflected and then escalated is ONE conversation that
 * escalated, not a deflection plus an escalation. Failing to collapse the pair
 * inflates both the numerator and the denominator, which is the sessionization
 * error that makes a naive rate report a success on a conversation that ended
 * with the customer waiting on a human.
 */
export function deflectionStats(counts: ConversationCounts): DeflectionStats {
  const deflected = Math.max(0, counts.deflected);
  const escalated = Math.max(0, counts.escalated);
  // A revert is both a deflection and an escalation, so it can never exceed
  // either count.
  const reverted = Math.min(Math.max(0, counts.reverted ?? 0), deflected, escalated);

  const naiveConversations = deflected + escalated;
  const conversations = naiveConversations - reverted;
  const stuck = deflected - reverted;

  return {
    deflected,
    escalated,
    reverted,
    conversations,
    rate: conversations > 0 ? stuck / conversations : null,
    naiveRate: naiveConversations > 0 ? deflected / naiveConversations : null,
  };
}

/** Formats a rate for display, preserving the "no data" case. */
export function formatDeflection(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}
