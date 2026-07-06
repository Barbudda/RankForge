"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

// Inlined (not imported from lib/support/knowledge) so the support prompt
// and knowledge base never ship in the client bundle.
const SUGGESTED_QUESTIONS = [
  "What does RankForge do?",
  "Is it safe for my main branch?",
  "Which frameworks are supported?",
  "How do the modification levels work?",
];

type Source = { title: string; url: string };
type Msg = { role: "user" | "assistant"; content: string; sources?: Source[] };

const GREETING: Msg = {
  role: "assistant",
  content:
    "Ask about audits, pull requests, modification levels, security or pricing. Answers come straight from the RankForge docs.",
};

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading, open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          // Strip client-only fields (sources) — the API expects role+content.
          messages: next
            .filter((m) => m !== GREETING)
            .map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            data.answer ??
            "Sorry — something went wrong. Please try again in a moment.",
          sources: Array.isArray(data.sources) ? data.sources.slice(0, 3) : [],
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "I couldn't reach support just now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[90] print:hidden">
      {open && (
        <div className="mb-3 flex h-[30rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-elevated/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <span className="grid size-8 place-items-center rounded-lg border border-border bg-surface">
              <MessageCircle className="size-4 text-electric" />
            </span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-fg">RankForge support</div>
              <div className="text-[11px] text-fg-subtle">
                Answers from the RankForge docs
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="grid size-7 place-items-center rounded-md text-fg-subtle hover:text-fg"
              aria-label="Close support chat"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-electric text-white"
                      : "border border-border bg-surface text-fg-muted",
                  )}
                >
                  <span className="whitespace-pre-wrap">{m.content}</span>
                  {m.role === "assistant" && !!m.sources?.length && (
                    <span className="mt-2 flex flex-wrap gap-1.5 border-t border-border pt-2">
                      {m.sources.map((s) => (
                        <a
                          key={s.url}
                          href={s.url}
                          className="inline-flex max-w-full items-center gap-1 truncate rounded border border-border bg-bg/40 px-1.5 py-0.5 text-[11px] text-electric-bright transition-colors hover:border-electric/40"
                          title={s.title}
                        >
                          {s.title}
                        </a>
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl border border-border bg-surface px-3.5 py-3">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="size-1.5 animate-bounce rounded-full bg-fg-subtle"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Suggested questions (only before the first user turn) */}
            {messages.length === 1 && !loading && (
              <div className="space-y-2 pt-1">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="block w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-left text-xs text-fg-muted transition-colors hover:border-electric/40 hover:text-fg"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
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
              placeholder="Ask about RankForge…"
              className="h-9 flex-1 rounded-lg border border-border bg-surface/60 px-3 text-sm text-fg outline-none placeholder:text-fg-subtle focus-visible:border-electric/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-electric text-white transition-colors hover:bg-electric-bright disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "ml-auto flex size-12 items-center justify-center rounded-full shadow-lg transition-colors",
          open
            ? "bg-surface text-fg-muted hover:text-fg"
            : "bg-electric text-white hover:bg-electric-bright",
        )}
        aria-label={open ? "Close support chat" : "Open support chat"}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>
    </div>
  );
}
