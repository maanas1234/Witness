"use client";

import { useMemo, useState } from "react";
import { Commitment, Meeting, TimelineEvent } from "@/lib/types";
import { deriveStatus, STATUS_META } from "@/lib/status";
import { DEMO_MEETINGS } from "@/lib/demo-data";
import { CommitmentCard } from "./CommitmentCard";
import { BotJoinPanel } from "./BotJoinPanel";
import { MeetingBotCallout } from "./MeetingBotCallout";
import { ChatPanel } from "./ChatPanel";
import { MarkdownLite } from "@/lib/markdown-lite";

let idCounter = 0;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}_${idCounter}_${Date.now().toString(36)}`;
}

type LogLine = { id: string; text: string; tone: "info" | "warn" | "good" };

const COLUMN_ORDER: Commitment["status"][] = ["broken", "at_risk", "open", "fulfilled"];
const COLUMN_LABEL: Record<Commitment["status"], string> = {
  broken: "Broken",
  at_risk: "At risk",
  open: "On track",
  fulfilled: "Fulfilled",
};

export function Workspace({ attendeeEnabled }: { attendeeEnabled: boolean }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [log, setLog] = useState<LogLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [briefingBusy, setBriefingBusy] = useState(false);

  const [manualLabel, setManualLabel] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");
  const [transcribing, setTranscribing] = useState(false);

  const nextUnprocessed = meetings.find((m) => !m.processed);

  async function handleAudioUpload(file: File) {
    setTranscribing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error ?? "Transcription failed");
      const data = await res.json();
      setManualTranscript(data.text);
      if (!manualLabel.trim()) setManualLabel(file.name.replace(/\.[^.]+$/, ""));
      if (!manualDate.trim()) setManualDate(new Date().toISOString().slice(0, 10));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription failed");
    } finally {
      setTranscribing(false);
    }
  }

  const pushLog = (text: string, tone: LogLine["tone"] = "info") =>
    setLog((prev) => [...prev, { id: nextId("log"), text, tone }]);

  function loadDemo() {
    setMeetings(
      DEMO_MEETINGS.map((m) => ({
        id: nextId("mtg"),
        label: m.label,
        date: m.date,
        transcript: m.transcript,
        processed: false,
      }))
    );
    setCommitments([]);
    setLog([]);
    setBriefing(null);
    setError(null);
  }

  function addManualMeeting() {
    if (!manualLabel.trim() || !manualDate.trim() || !manualTranscript.trim()) return;
    setMeetings((prev) => [
      ...prev,
      {
        id: nextId("mtg"),
        label: manualLabel.trim(),
        date: manualDate.trim(),
        transcript: manualTranscript.trim(),
        processed: false,
      },
    ]);
    setManualLabel("");
    setManualDate("");
    setManualTranscript("");
  }

  async function processNextMeeting() {
    const meeting = meetings.find((m) => !m.processed);
    if (!meeting || busy) return;
    setBusy(true);
    setError(null);
    pushLog(`Reading "${meeting.label}" (${meeting.date})…`);

    try {
      const openCommitments = commitments.filter(
        (c) => c.status !== "fulfilled"
      );

      if (openCommitments.length === 0 && commitments.length === 0) {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: meeting.transcript,
            meetingLabel: meeting.label,
            meetingDate: meeting.date,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Extraction failed");
        const data = await res.json();

        const created: Commitment[] = data.commitments.map((c: {
          speaker: string; text: string; dueDate: string | null; quote: string;
        }) => {
          const timeline: TimelineEvent[] = [
            { meetingId: meeting.id, meetingLabel: meeting.label, meetingDate: meeting.date, type: "made", note: "Commitment made", quote: c.quote },
          ];
          const { status, overdueStreak } = deriveStatus(c.dueDate, timeline);
          return {
            id: nextId("cm"),
            speaker: c.speaker,
            text: c.text,
            dueDate: c.dueDate,
            quote: c.quote,
            originMeetingId: meeting.id,
            status,
            overdueStreak,
            timeline,
          };
        });

        created.forEach((c) => pushLog(`${c.speaker} committed: "${c.text}"`, "info"));
        setCommitments(created);
      } else {
        const res = await fetch("/api/reconcile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: meeting.transcript,
            meetingLabel: meeting.label,
            meetingDate: meeting.date,
            openCommitments: openCommitments.map((c) => ({
              id: c.id,
              speaker: c.speaker,
              text: c.text,
              dueDate: c.dueDate,
            })),
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Reconcile failed");
        const data = await res.json();

        const pendingLogs: { text: string; tone: LogLine["tone"] }[] = [];

        const updated = commitments.map((c) => {
          const update = data.updates.find((u: { id: string }) => u.id === c.id);
          if (!update) return c;

          const type: TimelineEvent["type"] =
            update.outcome === "fulfilled"
              ? "fulfilled"
              : update.outcome === "reaffirmed"
              ? "reaffirmed"
              : "silent";

          const event: TimelineEvent = {
            meetingId: meeting.id,
            meetingLabel: meeting.label,
            meetingDate: meeting.date,
            type,
            note: update.note,
            quote: update.evidenceQuote ?? undefined,
          };

          const timeline = [...c.timeline, event];
          const { status, overdueStreak } = deriveStatus(c.dueDate, timeline);

          if (type === "fulfilled") pendingLogs.push({ text: `${c.speaker} fulfilled: "${c.text}"`, tone: "good" });
          else if (status === "broken") pendingLogs.push({ text: `${c.speaker} still hasn't: "${c.text}" (${overdueStreak}x running)`, tone: "warn" });
          else if (status === "at_risk") pendingLogs.push({ text: `${c.speaker} is now overdue on: "${c.text}"`, tone: "warn" });

          return { ...c, status, overdueStreak, timeline };
        });

        const fresh: Commitment[] = data.newCommitments.map((c: {
          speaker: string; text: string; dueDate: string | null; quote: string;
        }) => {
          const timeline: TimelineEvent[] = [
            { meetingId: meeting.id, meetingLabel: meeting.label, meetingDate: meeting.date, type: "made", note: "Commitment made", quote: c.quote },
          ];
          const { status, overdueStreak } = deriveStatus(c.dueDate, timeline);
          pendingLogs.push({ text: `${c.speaker} committed: "${c.text}"`, tone: "info" });
          return {
            id: nextId("cm"),
            speaker: c.speaker,
            text: c.text,
            dueDate: c.dueDate,
            quote: c.quote,
            originMeetingId: meeting.id,
            status,
            overdueStreak,
            timeline,
          };
        });

        pendingLogs.forEach((l) => pushLog(l.text, l.tone));
        setCommitments([...updated, ...fresh]);
      }

      setMeetings((prev) => prev.map((m) => (m.id === meeting.id ? { ...m, processed: true } : m)));
      pushLog(`Finished "${meeting.label}".`, "good");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      pushLog("Processing failed — see error above.", "warn");
    } finally {
      setBusy(false);
    }
  }

  function resolveNudge(
    commitmentId: string,
    outcome: "fulfilled" | "still_working" | "unclear",
    note: string,
    quote: string
  ) {
    const target = commitments.find((c) => c.id === commitmentId);
    if (!target) return;

    const today = new Date().toISOString().slice(0, 10);
    const type: TimelineEvent["type"] = outcome === "fulfilled" ? "fulfilled" : "reaffirmed";
    const event: TimelineEvent = {
      meetingId: "slack",
      meetingLabel: "Slack follow-up",
      meetingDate: today,
      type,
      note: outcome === "fulfilled" ? `Fulfilled via Slack: ${note}` : `Slack reply: ${note}`,
      quote,
    };
    const timeline = [...target.timeline, event];
    const { status, overdueStreak } = deriveStatus(target.dueDate, timeline);

    setCommitments(
      commitments.map((c) => (c.id === commitmentId ? { ...c, status, overdueStreak, timeline } : c))
    );
    pushLog(
      outcome === "fulfilled"
        ? `${target.speaker} confirmed via Slack: "${target.text}"`
        : `${target.speaker} replied on Slack about: "${target.text}"`,
      outcome === "fulfilled" ? "good" : "info"
    );
  }

  async function generateBriefing() {
    const flagged = commitments.filter((c) => c.status === "at_risk" || c.status === "broken");
    setBriefingBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextMeetingLabel: "Next Sync",
          commitments: flagged.map((c) => ({
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
      if (!res.ok) throw new Error((await res.json()).error ?? "Briefing failed");
      const data = await res.json();
      setBriefing(data.briefing);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBriefingBusy(false);
    }
  }

  const columns = useMemo(() => {
    const map: Record<Commitment["status"], Commitment[]> = {
      broken: [], at_risk: [], open: [], fulfilled: [],
    };
    for (const c of commitments) map[c.status].push(c);
    return map;
  }, [commitments]);

  const scoreboard = useMemo(() => {
    const bySpeaker = new Map<string, { kept: number; total: number }>();
    for (const c of commitments) {
      const entry = bySpeaker.get(c.speaker) ?? { kept: 0, total: 0 };
      entry.total += 1;
      if (c.status === "fulfilled") entry.kept += 1;
      bySpeaker.set(c.speaker, entry);
    }
    return Array.from(bySpeaker.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [commitments]);

  return (
    <div id="get-started" className="mx-auto w-full max-w-6xl px-6 pb-32 scroll-mt-8">
      {/* Controls */}
      <div className="grid gap-4 rounded-xl border border-ink-line bg-ink-raised/60 p-5 md:grid-cols-[1fr_auto]">
        <div>
          <h2 className="font-display text-lg text-paper">Get started</h2>
          <p className="mt-1 text-sm text-paper-dim">
            Try the example below, or add your own meeting further down.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDemo}
            className="rounded-md border border-wire/40 bg-wire/10 px-4 py-2 text-sm font-medium text-paper transition hover:bg-wire/20"
          >
            Load demo scenario
          </button>
          <button
            onClick={processNextMeeting}
            disabled={!nextUnprocessed || busy}
            className="rounded-md bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy
              ? "Processing…"
              : nextUnprocessed
              ? `Process next: "${nextUnprocessed.label}"`
              : "No meetings queued"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red/40 bg-red/10 px-4 py-2 text-sm text-red">
          {error}
        </div>
      )}

      {/* Manual meeting input */}
      <div className="mt-4 rounded-xl border border-ink-line bg-ink-raised/40 p-5">
        <h3 className="font-display text-base text-paper">Add a meeting</h3>
        <p className="mt-1 text-sm text-paper-dim">
          Paste a transcript below, then queue it.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={manualLabel}
            onChange={(e) => setManualLabel(e.target.value)}
            placeholder="Meeting label, e.g. Weekly Sync"
            className="rounded-md border border-ink-line bg-ink px-3 py-2 text-sm text-paper placeholder:text-paper-dim/60 focus:border-wire focus:outline-none"
          />
          <input
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            placeholder="Date, e.g. 2026-07-20"
            className="rounded-md border border-ink-line bg-ink px-3 py-2 text-sm text-paper placeholder:text-paper-dim/60 focus:border-wire focus:outline-none"
          />
        </div>
        <textarea
          value={manualTranscript}
          onChange={(e) => setManualTranscript(e.target.value)}
          placeholder="Paste the transcript here…"
          rows={8}
          className="mt-3 w-full rounded-md border border-ink-line bg-ink px-3 py-2 text-sm text-paper placeholder:text-paper-dim/60 focus:border-wire focus:outline-none"
        />
        <button
          onClick={addManualMeeting}
          className="mt-3 rounded-md bg-paper px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-95"
        >
          Queue meeting
        </button>

        <details className="mt-5 border-t border-ink-line pt-4">
          <summary className="cursor-pointer font-mono-tight text-xs uppercase tracking-wider text-paper-dim">
            More ways to get a transcript in
          </summary>
          <div className="mt-3 flex items-center gap-3 rounded-md border border-dashed border-ink-line px-4 py-3">
            <label className="cursor-pointer text-sm font-medium text-wire hover:underline">
              {transcribing ? "Transcribing…" : "Upload a recording (audio/video)"}
              <input
                type="file"
                accept="audio/*,video/*"
                className="hidden"
                disabled={transcribing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAudioUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
            <span className="text-xs text-paper-dim">
              transcribed with Whisper, fills the transcript above
            </span>
          </div>
          {attendeeEnabled ? (
            <BotJoinPanel
              onTranscriptReady={(text, suggestedLabel) => {
                setManualTranscript(text);
                if (!manualLabel.trim()) setManualLabel(suggestedLabel);
                if (!manualDate.trim()) setManualDate(new Date().toISOString().slice(0, 10));
              }}
            />
          ) : (
            <MeetingBotCallout />
          )}
        </details>
      </div>

      {/* Meeting queue */}
      {meetings.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {meetings.map((m) => (
            <span
              key={m.id}
              className={`font-mono-tight rounded-full border px-3 py-1 text-xs ${
                m.processed
                  ? "border-green/30 text-green"
                  : m.id === nextUnprocessed?.id
                  ? "border-amber/50 text-amber"
                  : "border-ink-line text-paper-dim"
              }`}
            >
              {m.processed ? "✓" : "○"} {m.label} · {m.date}
            </span>
          ))}
        </div>
      )}

      {/* Processing log */}
      {log.length > 0 && (
        <details className="mt-6 rounded-xl border border-ink-line bg-ink/60 p-4">
          <summary className="cursor-pointer font-mono-tight text-xs text-paper-dim">
            Show reasoning ({log.length})
          </summary>
          <div className="mt-3 font-mono-tight text-xs">
            {log.map((l) => (
              <div
                key={l.id}
                className={`rise-in py-0.5 ${
                  l.tone === "warn" ? "text-amber" : l.tone === "good" ? "text-green" : "text-paper-dim"
                }`}
              >
                › {l.text}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Scoreboard */}
      {scoreboard.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          {scoreboard.map(([speaker, { kept, total }]) => (
            <div
              key={speaker}
              className="rounded-lg border border-ink-line bg-ink-raised px-4 py-2"
            >
              <div className="font-mono-tight text-[11px] uppercase tracking-wider text-paper-dim">
                {speaker}
              </div>
              <div className="font-display text-lg text-paper">
                {kept}/{total} <span className="text-xs text-paper-dim">kept</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accountability board */}
      {commitments.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {COLUMN_ORDER.map((status) => (
            <div key={status}>
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${STATUS_META[status].dot}`} />
                <h3 className="font-mono-tight text-xs uppercase tracking-wider text-paper-dim">
                  {COLUMN_LABEL[status]} · {columns[status].length}
                </h3>
              </div>
              <div className="space-y-2">
                {columns[status].map((c) => (
                  <CommitmentCard
                    key={c.id}
                    commitment={c}
                    onNudgeResolved={(outcome, note, quote) => resolveNudge(c.id, outcome, note, quote)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Briefing */}
      {commitments.length > 0 && (
        <div className="mt-10 rounded-xl border border-amber/30 bg-amber/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg text-paper">Pre-meeting briefing</h3>
              <p className="mt-1 text-sm text-paper-dim">
                Walk into the next meeting already knowing what to ask.
              </p>
            </div>
            <button
              onClick={generateBriefing}
              disabled={briefingBusy}
              className="shrink-0 rounded-md bg-paper px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-40"
            >
              {briefingBusy ? "Writing…" : "Generate briefing"}
            </button>
          </div>
          {briefing && (
            <div className="mt-4 rounded-lg border border-ink-line bg-ink/60 p-4">
              <MarkdownLite text={briefing} />
            </div>
          )}
        </div>
      )}

      {commitments.length > 0 && <ChatPanel commitments={commitments} meetings={meetings} />}
    </div>
  );
}
