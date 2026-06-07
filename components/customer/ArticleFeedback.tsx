"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

/** "Was this helpful?" — a familiar help-center touch. */
export default function ArticleFeedback() {
  const [voted, setVoted] = useState<null | "up" | "down">(null);

  if (voted) {
    return (
      <div className="mt-10 rounded-xl border border-border bg-surface px-5 py-4 text-sm text-muted">
        Thanks for your feedback — it helps us improve these articles.
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-5 py-4">
      <span className="text-sm font-medium">Was this article helpful?</span>
      <button
        onClick={() => setVoted("up")}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1 text-sm hover:border-accent"
      >
        <ThumbsUp className="h-3.5 w-3.5" /> Yes
      </button>
      <button
        onClick={() => setVoted("down")}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1 text-sm hover:border-accent"
      >
        <ThumbsDown className="h-3.5 w-3.5" /> No
      </button>
    </div>
  );
}
