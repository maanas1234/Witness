export type CommitmentStatus = "open" | "at_risk" | "broken" | "fulfilled";

export interface TimelineEvent {
  meetingId: string;
  meetingLabel: string;
  meetingDate: string;
  type: "made" | "reaffirmed" | "fulfilled" | "silent" | "escalated";
  note: string;
  quote?: string;
}

export interface Commitment {
  id: string;
  speaker: string;
  text: string;
  dueDate: string | null;
  quote: string;
  originMeetingId: string;
  status: CommitmentStatus;
  overdueStreak: number;
  timeline: TimelineEvent[];
}

export interface Meeting {
  id: string;
  label: string;
  date: string;
  transcript: string;
  processed: boolean;
}

export interface ExtractedCommitment {
  speaker: string;
  text: string;
  dueDate: string | null;
  quote: string;
}

export interface ReconcileUpdate {
  id: string;
  outcome: "fulfilled" | "reaffirmed" | "silent";
  evidenceQuote?: string;
  note: string;
}
