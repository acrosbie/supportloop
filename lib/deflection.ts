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

export interface ConversationCounts {
  /** Conversations the assistant answered from the KB, no human involved. */
  deflected: number;
  /** Conversations that became a ticket (from chat or live chat). */
  escalated: number;
}

export interface DeflectionStats extends ConversationCounts {
  /** deflected + escalated. The honest denominator. */
  conversations: number;
  /**
   * deflected / conversations, or null when there were no conversations at all.
   * Null rather than 0 on purpose: "nobody asked" is not "we deflected nothing",
   * and rendering an unmeasured period as 0% is its own small lie.
   */
  rate: number | null;
}

export function deflectionStats(counts: ConversationCounts): DeflectionStats {
  const deflected = Math.max(0, counts.deflected);
  const escalated = Math.max(0, counts.escalated);
  const conversations = deflected + escalated;
  return {
    deflected,
    escalated,
    conversations,
    rate: conversations > 0 ? deflected / conversations : null,
  };
}

/** Formats a rate for display, preserving the "no data" case. */
export function formatDeflection(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}
