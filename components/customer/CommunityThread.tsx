"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Answer {
  id: string;
  body: string;
  source: string;
  accepted: boolean;
  upvotes: number;
}
interface Source {
  id: string;
  title: string;
  similarity: number;
}

export default function CommunityThread({
  questionId,
  answers,
}: {
  questionId: string;
  answers: Answer[];
}) {
  const router = useRouter();
  const [suggesting, setSuggesting] = useState(false);
  const [gapMsg, setGapMsg] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [working, setWorking] = useState<string | null>(null);

  async function suggest() {
    setSuggesting(true);
    setGapMsg(null);
    setSources([]);
    try {
      const res = await fetch("/api/community-suggest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Suggestion failed");
      if (j.grounded) {
        setSources(j.sources || []);
      } else {
        setGapMsg(
          "No confident help-center match — flagged as a knowledge gap and a draft was created in the Knowledge Loop for the team to write."
        );
      }
      router.refresh();
    } catch (e) {
      setGapMsg(e instanceof Error ? e.message : "Suggestion failed");
    } finally {
      setSuggesting(false);
    }
  }

  async function act(answerId: string, action: string) {
    setWorking(answerId + action);
    try {
      const res = await fetch("/api/community-action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answerId, action }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Action failed");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          {answers.length} answer{answers.length === 1 ? "" : "s"}
        </h2>
        <button
          onClick={suggest}
          disabled={suggesting}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent-strong disabled:opacity-60"
        >
          {suggesting ? "Thinking…" : "Suggest an answer"}
        </button>
      </div>

      {gapMsg && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {gapMsg}
        </div>
      )}
      {sources.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-[11px] text-muted">Grounded in:</div>
          <div className="flex flex-wrap gap-1">
            {sources.map((s) => (
              <Link
                key={s.id}
                href={`/user/article/${s.id}`}
                className="rounded-full border border-border bg-white px-2 py-0.5 text-[11px] text-accent-strong hover:border-accent"
              >
                {s.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {answers.map((a) => (
          <li key={a.id} className={`rounded-xl border p-4 ${a.accepted ? "border-green-200 bg-green-50" : "border-border bg-white"}`}>
            <div className="flex items-center gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 ${a.source === "ai" ? "bg-accent-soft text-accent-strong" : "bg-surface-2 text-muted"}`}>
                {a.source === "ai" ? "AI suggestion" : "Community"}
              </span>
              {a.accepted && <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">✓ Accepted</span>}
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm">{a.body}</div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => act(a.id, "upvote")}
                disabled={working !== null}
                className="rounded-lg border border-border px-2 py-1 text-xs text-foreground/70 hover:bg-surface-2 disabled:opacity-60"
              >
                ▲ {a.upvotes}
              </button>
              {!a.accepted && (
                <button
                  onClick={() => act(a.id, "accept")}
                  disabled={working !== null}
                  className="rounded-lg border border-border px-2 py-1 text-xs text-foreground/70 hover:bg-surface-2 disabled:opacity-60"
                >
                  Accept
                </button>
              )}
            </div>
          </li>
        ))}
        {answers.length === 0 && (
          <li className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            No answers yet. Click “Suggest an answer” for an AI answer grounded in the help center.
          </li>
        )}
      </ul>
    </div>
  );
}
