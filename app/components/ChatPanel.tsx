"use client";

import { useState } from "react";
import { Commitment, Meeting } from "@/lib/types";

type ChatMessage = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "Who's slipping the most?",
  "What does Meera still owe?",
  "What's on track?",
];

export function ChatPanel({
  commitments,
  meetings,
}: {
  commitments: Commitment[];
  meetings: Meeting[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask(q: string) {
    if (!q.trim() || busy) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          commitments: commitments.map((c) => ({
            speaker: c.speaker,
            text: c.text,
            dueDate: c.dueDate,
            status: c.status,
            overdueStreak: c.overdueStreak,
            originMeetingLabel:
              meetings.find((m) => m.id === c.originMeetingId)?.label ?? "earlier meeting",
          })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer ?? data.error ?? "No answer." },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Something went wrong." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-wire/30 bg-wire/5 p-5">
      <h3 className="font-display text-lg text-paper">Ask Witness</h3>
      <p className="mt-1 text-sm text-paper-dim">Plain-language questions over the ledger.</p>

      {messages.length > 0 && (
        <div className="mt-4 max-h-64 space-y-3 overflow-y-auto rounded-lg border border-ink-line bg-ink/60 p-3">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <span
                className={`inline-block max-w-[85%] rounded-md px-3 py-1.5 text-sm ${
                  m.role === "user" ? "bg-wire/20 text-paper" : "bg-ink-raised text-paper-dim"
                }`}
              >
                {m.text}
              </span>
            </div>
          ))}
          {busy && <div className="font-mono-tight text-xs text-paper-dim">thinking…</div>}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            disabled={busy}
            className="rounded-full border border-ink-line px-3 py-1 text-xs text-paper-dim transition hover:border-wire hover:text-paper disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(question)}
          placeholder="Ask about who owes what…"
          disabled={busy}
          className="flex-1 rounded-md border border-ink-line bg-ink px-3 py-2 text-sm text-paper placeholder:text-paper-dim/60 focus:border-wire focus:outline-none"
        />
        <button
          onClick={() => ask(question)}
          disabled={busy || !question.trim()}
          className="rounded-md bg-wire px-4 py-2 text-sm font-semibold text-paper transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ask
        </button>
      </div>
    </div>
  );
}
