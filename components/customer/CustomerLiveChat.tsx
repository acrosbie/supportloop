"use client";

import { useEffect, useState } from "react";
import LiveChatRoom from "@/components/LiveChatRoom";
import { Spinner } from "@/components/ui/spinner";

export default function CustomerLiveChat() {
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/live/start", { method: "POST" });
        const j = await r.json();
        if (!r.ok || !j.ok) throw new Error();
        if (!cancelled) setTicketId(j.ticketId);
      } catch {
        if (!cancelled) setErr(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) return <p className="text-sm text-danger">Couldn&apos;t start a live chat. Please try again.</p>;
  if (!ticketId)
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <Spinner className="h-4 w-4" /> Connecting you to an agent…
      </div>
    );
  return <LiveChatRoom ticketId={ticketId} role="customer" />;
}
