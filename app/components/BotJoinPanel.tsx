"use client";

import { useEffect, useRef, useState } from "react";

type BotStatus = "idle" | "joining" | "in_meeting" | "done" | "error";

const STATE_LABEL: Record<string, string> = {
  ready: "Preparing…",
  joining: "Joining the meeting…",
  joined_not_recording: "Joined, starting to record…",
  joined_recording: "In the meeting, recording…",
  leaving: "Leaving…",
  post_processing: "Processing the recording…",
  ended: "Done",
  waiting_room: "Waiting to be let in…",
  fatal_error: "Failed",
};

export function BotJoinPanel({
  onTranscriptReady,
}: {
  onTranscriptReady: (text: string, suggestedLabel: string) => void;
}) {
  const [meetingUrl, setMeetingUrl] = useState("");
  const [status, setStatus] = useState<BotStatus>("idle");
  const [botState, setBotState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function join() {
    if (!meetingUrl.trim()) return;
    setStatus("joining");
    setError(null);
    try {
      const res = await fetch("/api/attendee/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingUrl: meetingUrl.trim(), botName: "Witness" }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create bot");
      const { botId } = await res.json();
      setStatus("in_meeting");

      pollRef.current = setInterval(async () => {
        try {
          const s = await fetch(`/api/attendee/status?botId=${botId}`);
          const data = await s.json();
          if (data.error && !data.done) throw new Error(data.error);
          setBotState(data.state);
          if (data.done) {
            if (pollRef.current) clearInterval(pollRef.current);
            if (data.error) {
              setStatus("error");
              setError(data.error);
            } else {
              setStatus("done");
              onTranscriptReady(data.text, "Meeting via Witness bot");
            }
          }
        } catch (e) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStatus("error");
          setError(e instanceof Error ? e.message : "Polling failed");
        }
      }, 5000);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed to create bot");
    }
  }

  return (
    <div className="mt-4 rounded-md border border-dashed border-wire/40 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={meetingUrl}
          onChange={(e) => setMeetingUrl(e.target.value)}
          placeholder="Zoom / Google Meet / Teams link"
          disabled={status === "joining" || status === "in_meeting"}
          className="min-w-[240px] flex-1 rounded-md border border-ink-line bg-ink px-3 py-2 text-sm text-paper placeholder:text-paper-dim/60 focus:border-wire focus:outline-none"
        />
        <button
          onClick={join}
          disabled={status === "joining" || status === "in_meeting" || !meetingUrl.trim()}
          className="rounded-md bg-wire px-4 py-2 text-sm font-semibold text-paper transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send Witness to this meeting
        </button>
      </div>
      {(status === "joining" || status === "in_meeting") && (
        <p className="mt-2 flex items-center gap-2 font-mono-tight text-xs text-wire">
          <span className="h-1.5 w-1.5 rounded-full bg-wire pulse-dot" />
          {STATE_LABEL[botState ?? ""] ?? "Working…"}
        </p>
      )}
      {status === "done" && (
        <p className="mt-2 font-mono-tight text-xs text-green">
          Meeting captured — transcript loaded below.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red">{error}</p>}
      <p className="mt-2 text-xs text-paper-dim">
        Requires a self-hosted Attendee instance (see README). Runs a real bot that joins
        the call, records, and transcribes via the meeting platform&apos;s free closed captions.
      </p>
    </div>
  );
}
