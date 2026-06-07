"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export default function CsatRater({ ticketId, initial }: { ticketId: string; initial: number | null }) {
  const [score, setScore] = useState<number | null>(initial);
  const [hover, setHover] = useState(0);
  const saved = score != null;

  async function rate(s: number) {
    setScore(s);
    try {
      await fetch("/api/csat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketId, score: s }),
      });
    } catch {
      /* best-effort */
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-xs text-muted">{saved ? "Your rating" : "Rate your experience"}</span>
      <div className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => rate(s)}
            onMouseEnter={() => setHover(s)}
            aria-label={`${s} star${s === 1 ? "" : "s"}`}
            className="p-0.5"
          >
            <Star className={`h-4 w-4 ${(hover || score || 0) >= s ? "fill-warning text-warning" : "text-border-strong"}`} />
          </button>
        ))}
      </div>
      {saved && <span className="text-xs text-success">Thanks!</span>}
    </div>
  );
}
