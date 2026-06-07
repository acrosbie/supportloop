"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";

type Role = "customer" | "agent";
interface Msg {
  role: Role;
  body: string;
  ts: number;
}

/**
 * Realtime chat between a customer and an agent, keyed on a ticket id, over a
 * Supabase Broadcast channel (+ Presence for online/typing). Messages also POST
 * to /api/live/send for history, so it stays functional if realtime drops.
 */
export default function LiveChatRoom({ ticketId, role, initial = [] }: { ticketId: string; role: Role; initial?: Msg[] }) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const other: Role = role === "customer" ? "agent" : "customer";

  useEffect(() => {
    const sb = createSupabaseBrowser();
    const channel = sb.channel(`chat:${ticketId}`, {
      config: { broadcast: { self: false }, presence: { key: role } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "msg" }, ({ payload }) => setMessages((m) => [...m, payload as Msg]))
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const p = payload as { role: Role; typing: boolean };
        if (p.role === other) setOtherTyping(p.typing);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ role: Role }>();
        const online = Object.values(state).some((arr) => arr.some((p) => p.role === other));
        setOtherOnline(online);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ role });
      });

    return () => {
      sb.removeChannel(channel);
    };
  }, [ticketId, role, other]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, otherTyping]);

  function broadcastTyping(typing: boolean) {
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { role, typing } });
  }

  async function send() {
    const text = input.trim();
    if (!text) return;
    const msg: Msg = { role, body: text, ts: Date.now() };
    setMessages((m) => [...m, msg]);
    setInput("");
    broadcastTyping(false);
    channelRef.current?.send({ type: "broadcast", event: "msg", payload: msg });
    try {
      await fetch("/api/live/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketId, body: text }),
      });
    } catch {
      /* broadcast already delivered; history best-effort */
    }
  }

  const presenceLabel =
    role === "customer"
      ? otherOnline
        ? "Agent connected"
        : "Waiting for an agent…"
      : otherOnline
        ? "Customer online"
        : "Customer away";

  return (
    <div className="flex h-[28rem] flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className={`h-2 w-2 rounded-full ${otherOnline ? "bg-success" : "bg-border-strong"}`} />
          {presenceLabel}
        </div>
        <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-danger">
          Live
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-auto p-3">
        {messages.length === 0 && <div className="text-sm text-muted">Say hello to start the conversation.</div>}
        {messages.map((m, i) => (
          <div key={i} className={m.role === role ? "flex justify-end" : ""}>
            <div
              className={
                m.role === role
                  ? "max-w-[80%] rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-sm text-accent-fg"
                  : "max-w-[80%] rounded-2xl rounded-bl-sm bg-surface-2 px-3 py-2 text-sm"
              }
            >
              {m.body}
            </div>
          </div>
        ))}
        {otherTyping && <div className="px-1 text-xs text-muted">typing…</div>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            broadcastTyping(e.target.value.length > 0);
          }}
          placeholder="Type a message…"
          className="field"
        />
        <Button type="submit" size="sm" disabled={!input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
