"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Markdown } from "@/components/ui/markdown";
import { toast } from "@/components/ui/toaster";
import { personaName } from "@/lib/people";
import { cn } from "@/lib/utils";

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

export default function CommunityThread({ questionId, answers }: { questionId: string; answers: Answer[] }) {
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
        toast.success("AI answer added");
      } else {
        setGapMsg(
          "We couldn't find a confident answer in the help center — our team has been notified and will follow up here."
        );
        toast("Sent to our support team");
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Suggestion failed");
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
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted">
          {answers.length} answer{answers.length === 1 ? "" : "s"}
        </h2>
        <Button size="sm" onClick={suggest} disabled={suggesting}>
          <Sparkles className="h-4 w-4" />
          {suggesting ? "Thinking…" : "Suggest an answer"}
        </Button>
      </div>

      {gapMsg && (
        <div className="mt-3 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-warning">
          {gapMsg}
        </div>
      )}
      {sources.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-[11px] text-muted">Based on:</div>
          <div className="flex flex-wrap gap-1">
            {sources.map((s) => (
              <Link
                key={s.id}
                href={`/user/article/${s.id}`}
                className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-accent-strong hover:border-accent"
              >
                {s.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {answers.map((a) => (
          <li
            key={a.id}
            className={cn("rounded-xl border p-4", a.accepted ? "border-success/30 bg-success-soft" : "border-border bg-white")}
          >
            <div className="flex items-start gap-3">
              <Avatar name={a.source === "ai" ? "Orbit Assistant" : personaName(a.id)} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-medium text-foreground">
                    {a.source === "ai" ? "Orbit Assistant" : personaName(a.id)}
                  </span>
                  <Badge tone={a.source === "ai" ? "accent" : "neutral"}>{a.source === "ai" ? "AI" : "Member"}</Badge>
                  {a.accepted && (
                    <Badge tone="success">
                      <Check className="h-3 w-3" /> Accepted
                    </Badge>
                  )}
                </div>
                <div className="mt-2">
                  <Markdown>{a.body}</Markdown>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => act(a.id, "upvote")} disabled={working !== null}>
                    <ChevronUp className="h-3.5 w-3.5" /> {a.upvotes}
                  </Button>
                  {!a.accepted && (
                    <Button variant="ghost" size="sm" onClick={() => act(a.id, "accept")} disabled={working !== null}>
                      Accept
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
        {answers.length === 0 && (
          <li className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            No answers yet. Use “Suggest an answer” to get an instant answer from the help center.
          </li>
        )}
      </ul>
    </div>
  );
}
