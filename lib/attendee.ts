const BASE_URL = process.env.ATTENDEE_BASE_URL || "http://localhost:8000";

function apiKey(): string {
  const key = process.env.ATTENDEE_API_KEY;
  if (!key) throw new Error("ATTENDEE_API_KEY is not set");
  return key;
}

async function attendeeFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${apiKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Attendee ${path} failed: ${res.status} ${body}`);
  }
  return res.json();
}

export interface AttendeeBot {
  id: string;
  meeting_url: string;
  state: string;
  transcription_state: string;
  recording_state: string;
}

export function createBot(meetingUrl: string, botName: string): Promise<AttendeeBot> {
  return attendeeFetch("/bots", {
    method: "POST",
    body: JSON.stringify({
      meeting_url: meetingUrl,
      bot_name: botName,
      // Free, no third-party transcription provider key required.
      transcription_settings: { meeting_closed_captions: {} },
    }),
  });
}

export function getBot(botId: string): Promise<AttendeeBot> {
  return attendeeFetch(`/bots/${botId}`);
}

export interface AttendeeUtterance {
  speaker_name: string;
  speaker_uuid: string;
  timestamp_ms: number;
  duration_ms: number;
  transcription: { transcript: string } | null;
}

export function getTranscript(botId: string): Promise<AttendeeUtterance[]> {
  return attendeeFetch(`/bots/${botId}/transcript`);
}

const TERMINAL_STATES = new Set(["ended", "fatal_error", "data_deleted"]);

export function isTerminalState(state: string): boolean {
  return TERMINAL_STATES.has(state);
}

export function transcriptToText(utterances: AttendeeUtterance[]): string {
  return utterances
    .filter((u) => u.transcription?.transcript)
    .sort((a, b) => a.timestamp_ms - b.timestamp_ms)
    .map((u) => `${u.speaker_name}: ${u.transcription!.transcript}`)
    .join("\n");
}
