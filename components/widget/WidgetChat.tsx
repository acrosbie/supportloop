"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Sparkles } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
import LoopClosedNote from "@/components/customer/LoopClosedNote";
import { streamGrounded, type GroundedSource as Source } from "@/lib/grounded-stream";

interface Msg {
  role: "user" | "assistant";
  content: string;
  grounded?: boolean;
  confidence?: number;
  sources?: Source[];
  ticketId?: string;
  escalating?: boolean;
  error?: boolean;
}

function patchLast(arr: Msg[], patch: Partial<Msg>): Msg[] {
  const copy = [...arr];
  copy[copy.length - 1] = { ...copy[copy.length - 1], ...patch };
  return copy;
}

interface Identity {
  name: string;
  email: string;
  account: string | null;
}

/** Standalone, embeddable chat — fills an iframe and is scoped to one workspace. */
export default function WidgetChat({
  orgName,
  orgSlug,
  accentStyle,
  identityToken,
}: {
  orgName: string;
  orgSlug: string;
  accentStyle?: CSSProperties;
  identityToken?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Intercom-style handshake: hand the host app's signed token to /api/identify,
  // which verifies it against the org secret and upserts the customer + account.
  // Anonymous visitors simply skip this and keep the existing behaviour.
  useEffect(() => {
    if (!identityToken) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/identify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orgSlug, token: identityToken }),
        });
        const j = await res.json();
        if (!cancelled && res.ok && j.ok) {
          setIdentity({ name: j.name, email: j.email, account: j.account ?? null });
        }
      } catch {
        /* identity is an enhancement — chat still works anonymously */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [identityToken, orgSlug]);

  function scrollToBottom() {
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setBusy(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "" }]);
    scrollToBottom();
    try {
      await streamGrounded(
        "/api/chat",
        { message: q, orgSlug },
        {
          onMeta: (meta) =>
            setMessages((m) =>
              patchLast(m, { grounded: meta.grounded, confidence: meta.topSimilarity, sources: meta.sources })
            ),
          onText: (acc) => {
            setMessages((m) => patchLast(m, { content: acc }));
            scrollToBottom();
          },
        }
      );
    } catch (e) {
      setMessages((m) => patchLast(m, { content: e instanceof Error ? e.message : "Something went wrong.", error: true }));
    } finally {
      setBusy(false);
      scrollToBottom();
    }
  }

  async function escalate(idx: number, question: string) {
    setMessages((m) => m.map((msg, i) => (i === idx ? { ...msg, escalating: true } : msg)));
    try {
      const res = await fetch("/api/ticket", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: question, orgSlug, identityToken }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Could not create ticket");
      setMessages((m) => m.map((msg, i) => (i === idx ? { ...msg, escalating: false, ticketId: j.ticketId } : msg)));
    } catch {
      setMessages((m) => m.map((msg, i) => (i === idx ? { ...msg, escalating: false, error: true } : msg)));
    }
  }

  return (
    <div className="flex h-screen flex-col bg-white" style={accentStyle}>
      <div className="flex items-center gap-2.5 bg-gradient-to-br from-accent-strong to-accent px-4 py-4 text-accent-fg">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold">{orgName} Assistant</div>
          <div className="text-[11px] opacity-90">
            {identity
              ? `Signed in as ${identity.name}${identity.account ? ` · ${identity.account}` : ""}`
              : "Replies instantly · from the help center"}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto p-3">
        {messages.length === 0 && (
          <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-surface-2 px-3 py-2 text-sm">
            👋 Hi! Ask me anything — I answer from {orgName}&apos;s help center, and if I can&apos;t, I&apos;ll open a support
            ticket for you.
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-sm text-accent-fg"
                  : "max-w-[92%] rounded-2xl rounded-bl-sm bg-surface-2 px-3 py-2 text-sm"
              }
            >
              {m.role === "assistant" ? (
                m.content ? (
                  <Markdown>{m.content}</Markdown>
                ) : (
                  <span className="text-muted">{busy && i === messages.length - 1 ? "…" : ""}</span>
                )
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}

              {m.role === "assistant" && m.content && (
                <div className="mt-2 border-t border-border pt-2">
                  {m.grounded && m.sources && m.sources.length > 0 ? (
                    <div>
                      <div className="mb-1 text-[11px] text-muted">
                        Grounded in {m.sources.length} article{m.sources.length === 1 ? "" : "s"} · top match{" "}
                        {m.confidence?.toFixed(2)}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {m.sources.map((s) => (
                          <span key={s.id} className="rounded-full border border-border bg-white px-2 py-0.5 text-[11px] text-accent-strong">
                            {s.title}
                          </span>
                        ))}
                      </div>
                      <LoopClosedNote sources={m.sources} articleBase={`/help/${orgSlug}/article`} />
                    </div>
                  ) : m.grounded === false ? (
                    <div>
                      <div className="mb-1.5 text-[11px] text-amber-700">
                        No confident help-center match (best {m.confidence?.toFixed(2)}).
                      </div>
                      {m.ticketId ? (
                        <div className="text-[11px] text-green-700">
                          ✓ Ticket created (#{m.ticketId.slice(0, 8)}) — a human will follow up.
                        </div>
                      ) : (
                        <button
                          onClick={() => escalate(i, messages[i - 1]?.content ?? "")}
                          disabled={m.escalating}
                          className="rounded-lg bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-fg disabled:opacity-60"
                        >
                          {m.escalating ? "Creating ticket…" : "Create a support ticket"}
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
