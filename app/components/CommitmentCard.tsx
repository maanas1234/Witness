"use client";

import { useState } from "react";
import { Commitment, TimelineEvent } from "@/lib/types";
import { STATUS_META } from "@/lib/status";

const PULSE_COLOR: Record<TimelineEvent["type"], string> = {
  made: "bg-wire",
  fulfilled: "bg-green",
  reaffirmed: "bg-amber",
  silent: "bg-red",
  escalated: "bg-red",
};

function PulseTimeline({ timeline }: { timeline: TimelineEvent[] }) {
  return (
    <div className="flex items-center gap-1">
      {timeline.map((ev, i) => (
        <span
          key={i}
          title={`${ev.meetingLabel}: ${ev.note}`}
          className={`h-1.5 w-3 rounded-full ${PULSE_COLOR[ev.type]}`}
        />
      ))}
    </div>
  );
}

type NudgeState = "idle" | "sending" | "sent" | "checking" | "error";

export function CommitmentCard({
  commitment,
  onNudgeResolved,
}: {
  commitment: Commitment;
  onNudgeResolved?: (outcome: "fulfilled" | "still_working" | "unclear", note: string, quote: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState<NudgeState>("idle");
  const [nudgeError, setNudgeError] = useState<string | null>(null);
  const [channel, setChannel] = useState<string | null>(null);
  const [ts, setTs] = useState<string | null>(null);
  const meta = STATUS_META[commitment.status];

  const nudgeable = commitment.status === "at_risk" || commitment.status === "broken";

  async function sendNudge() {
    setNudge("sending");
    setNudgeError(null);
    try {
      const res = await fetch("/api/slack/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speaker: commitment.speaker,
          text: commitment.text,
          dueDate: commitment.dueDate,
          overdueStreak: commitment.overdueStreak,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setChannel(data.channel);
      setTs(data.ts);
      setNudge("sent");
    } catch (e) {
      setNudge("error");
      setNudgeError(e instanceof Error ? e.message : "Failed to send");
    }
  }

  async function checkReply() {
    if (!channel || !ts) return;
    setNudge("checking");
    setNudgeError(null);
    try {
      const res = await fetch("/api/slack/check-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, afterTs: ts, commitmentText: commitment.text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to check");
      if (!data.found) {
        setNudge("sent");
        setNudgeError("No reply yet.");
        return;
      }
      onNudgeResolved?.(data.outcome, data.note, data.replyText);
    } catch (e) {
      setNudge("sent");
      setNudgeError(e instanceof Error ? e.message : "Failed to check");
    }
  }

  return (
    <div className="rise-in rounded-lg border border-ink-line bg-ink-raised p-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
            <span className="font-mono-tight text-[11px] uppercase tracking-wider text-paper-dim">
              {commitment.speaker}
            </span>
          </div>
          <p className="mt-1 text-sm leading-snug text-paper">{commitment.text}</p>
          <div className="mt-2">
            <PulseTimeline timeline={commitment.timeline} />
          </div>
        </div>
        <div className="shrink-0 text-right">
          {commitment.dueDate && (
            <div className="font-mono-tight text-[11px] text-paper-dim">
              due {commitment.dueDate}
            </div>
          )}
          {commitment.overdueStreak > 0 && commitment.status !== "fulfilled" && (
            <div className={`font-mono-tight text-[11px] ${meta.color}`}>
              {commitment.overdueStreak}x slipped
            </div>
          )}
        </div>
      </button>

      {nudgeable && (
        <div className="mt-3 flex items-center gap-2 border-t border-ink-line pt-3">
          {nudge === "idle" || nudge === "error" ? (
            <button
              onClick={sendNudge}
              className="rounded-md border border-wire/40 bg-wire/10 px-2.5 py-1 text-xs font-medium text-wire transition hover:bg-wire/20"
            >
              Nudge via Slack
            </button>
          ) : nudge === "sending" ? (
            <span className="font-mono-tight text-xs text-paper-dim">sending…</span>
          ) : (
            <>
              <span className="font-mono-tight text-xs text-green">sent to Slack</span>
              <button
                onClick={checkReply}
                disabled={nudge === "checking"}
                className="rounded-md border border-ink-line px-2.5 py-1 text-xs text-paper-dim transition hover:border-wire hover:text-paper disabled:opacity-40"
              >
                {nudge === "checking" ? "checking…" : "Check for reply"}
              </button>
            </>
          )}
          {nudgeError && <span className="text-xs text-red">{nudgeError}</span>}
        </div>
      )}

      {open && (
        <div className="mt-3 space-y-2 border-t border-ink-line pt-3">
          {commitment.timeline.map((ev, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="font-mono-tight w-28 shrink-0 text-paper-dim">
                {ev.meetingLabel}
              </span>
              <div>
                <span className="text-paper-dim">{ev.note}</span>
                {ev.quote && (
                  <p className="mt-0.5 font-mono-tight text-paper-dim/70 italic">
                    &ldquo;{ev.quote}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
