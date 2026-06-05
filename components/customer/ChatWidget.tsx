"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Sparkles, X } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";

interface Source {
  id: string;
  title: string;
  similarity: number;
}
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

const EXAMPLES = [
  "I was charged twice this month",
  "My microphone isn't working in meetings",
  "Can I get an editable transcript of a meeting?",
];

function patchLast(arr: Msg[], patch: Partial<Msg>): Msg[] {
  const copy = [...arr];
  const i = copy.length - 1;
  copy[i] = { ...copy[i], ...patch };
  return copy;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-assistant", handler);
    return () => window.removeEventListener("open-assistant", handler);
  }, []);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setBusy(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "" }]);
    scrollToBottom();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "The assistant is unavailable right now.");
      }
      const metaRaw = res.headers.get("x-grounding");
      const meta = metaRaw ? JSON.parse(metaRaw) : { grounded: false, sources: [], topSimilarity: 0 };
      setMessages((m) => patchLast(m, { grounded: meta.grounded, confidence: meta.topSimilarity, sources: meta.sources }));

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => patchLast(m, { content: acc }));
        scrollToBottom();
      }
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
        body: JSON.stringify({ message: question }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Could not create ticket");
      setMessages((m) => m.map((msg, i) => (i === idx ? { ...msg, escalating: false, ticketId: j.ticketId } : msg)));
    } catch {
      setMessages((m) => m.map((msg, i) => (i === idx ? { ...msg, escalating: false, error: true } : msg)));
    }
  }

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Orbit Assistant"
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg transition-transform hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 flex h-[min(70vh,32rem)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-br from-accent-strong to-accent px-4 py-4 text-accent-fg">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Orbit Assistant</div>
                <div className="text-[11px] opacity-90">Replies instantly · from the help center</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-white/20" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto p-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-surface-2 px-3 py-2 text-sm">
                  👋 Hi! I&apos;m the Orbit Assistant. Ask me anything — I answer from the help center, and if I can&apos;t, I&apos;ll open a support ticket for you.
                </div>
                <div className="text-xs font-medium text-muted">Try one of these</div>
                <div className="space-y-1.5">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => send(ex)}
                      className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-left text-sm text-foreground/80 transition-colors hover:border-accent"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
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

                  {/* Assistant meta: citations / confidence / escalate */}
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
      )}
    </>
  );
}
