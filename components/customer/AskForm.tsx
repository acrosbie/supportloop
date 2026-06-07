"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export default function AskForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/community-ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Couldn't post your question");
      toast.success("Question posted");
      router.push(`/user/community/${j.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't post your question");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's your question?"
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Details</label>
        <textarea
          required
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add any context that would help others answer…"
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Posting…" : "Post question"}
      </Button>
    </form>
  );
}
