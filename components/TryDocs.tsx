"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const SAMPLE = `# Refunds
We offer a full refund within 30 days of purchase, no questions asked. Refunds go to the original payment method and take 5–10 business days.

# Resetting your password
Go to Settings → Security → Reset password. The reset link is valid for 60 minutes. If it doesn't arrive, check your spam folder.

# Supported file types
You can upload PDF, PNG, JPG, and CSV files up to 25 MB each. Larger files require a Business plan.`;

interface QA {
  q: string;
  answer: string | null;
  grounded: boolean;
  topSimilarity: number;
}

export default function TryDocs() {
  const [docs, setDocs] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<QA[]>([]);

  async function ask() {
    if (!docs.trim() || !q.trim() || busy) return;
    const question = q.trim();
    setQ("");
    setBusy(true);
    try {
      const r = await fetch("/api/try", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ docs, question }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setHistory((h) => [
        { q: question, answer: j.answer, grounded: j.grounded, topSimilarity: j.topSimilarity },
        ...h,
      ]);
    } catch (e) {
      setHistory((h) => [
        { q: question, answer: e instanceof Error ? e.message : "Failed", grounded: false, topSimilarity: 0 },
        ...h,
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Your documentation</label>
          <button onClick={() => setDocs(SAMPLE)} className="text-xs font-medium text-accent-strong hover:underline">
            Load example
          </button>
        </div>
        <textarea
          value={docs}
          onChange={(e) => setDocs(e.target.value)}
          rows={16}
          placeholder="Paste your help center / docs as Markdown or plain text…"
          className="field mt-2 font-mono text-xs"
        />
        <p className="mt-2 text-xs text-muted">
          Nothing is stored — your docs are embedded in memory only to answer your question.
        </p>
      </div>

      <div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
          className="flex gap-2"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask a question about your docs…"
            className="field"
          />
          <Button type="submit" disabled={busy || !docs.trim() || !q.trim()}>
            {busy ? <Spinner className="h-4 w-4" /> : "Ask"}
          </Button>
        </form>

        <div className="mt-4 space-y-3">
          {history.length === 0 && (
            <p className="text-sm text-muted">
              Paste your docs, ask a question, and watch the assistant answer — grounded in what you pasted, or honestly
              escalate when it&apos;s not there.
            </p>
          )}
          {history.map((h, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4">
              <div className="text-sm font-medium">{h.q}</div>
              {h.grounded ? (
                <>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-success">
                    <ShieldCheck className="h-3.5 w-3.5" /> grounded · top match {h.topSimilarity.toFixed(2)}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground/90">{h.answer}</p>
                </>
              ) : (
                <div className="mt-2 flex items-start gap-1.5 text-sm text-warning">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {h.answer
                    ? h.answer
                    : `Not confidently covered by your docs (best match ${h.topSimilarity.toFixed(
                        2
                      )}) — in the product this escalates to a human instead of guessing.`}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
