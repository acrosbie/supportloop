"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export default function NewTicketForm({ loggedIn, defaultEmail }: { loggedIn: boolean; defaultEmail?: string }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    if (!loggedIn && !email.trim()) {
      toast.error("Add your email so we can reply");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/ticket", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subject,
          message,
          channel: "web",
          email: loggedIn ? undefined : email,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Couldn't submit your request");
      toast.success("Request submitted");
      if (loggedIn) {
        router.push("/user/tickets");
        router.refresh();
      } else {
        setDoneId(j.ticketId);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't submit your request");
    } finally {
      setBusy(false);
    }
  }

  if (doneId) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
        <div className="mt-2 text-lg font-semibold text-emerald-800">Request submitted</div>
        <p className="mt-1 text-sm text-emerald-800/80">
          Thanks — your reference is <span className="font-medium">#{doneId.slice(0, 8)}</span>. A teammate will reply to{" "}
          {email}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!loggedIn && (
        <div>
          <label className="mb-1 block text-sm font-medium">Your email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="field"
          />
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium">Subject</label>
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief summary of your issue"
          className="field"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">How can we help?</label>
        <textarea
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe what's happening, and any steps to reproduce…"
          className="field"
        />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Submitting…" : "Submit request"}
      </Button>
    </form>
  );
}
