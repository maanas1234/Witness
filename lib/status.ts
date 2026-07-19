import { Commitment, CommitmentStatus } from "./types";

/**
 * Status is derived deterministically from the timeline + due date, never asserted
 * by the model directly. The LLM only supplies raw evidence (fulfilled / reaffirmed /
 * silent per meeting); this function decides what that evidence means.
 *
 * overdueStreak = number of consecutive trailing meetings that happened AFTER the due
 * date where the commitment was still not fulfilled. The origin ("made") meeting never
 * counts toward the streak, since a commitment can't be overdue at the moment it's made.
 */
export function deriveStatus(
  dueDate: string | null,
  timeline: Commitment["timeline"]
): { status: CommitmentStatus; overdueStreak: number } {
  const lastEvent = timeline[timeline.length - 1];

  if (lastEvent?.type === "fulfilled") {
    return { status: "fulfilled", overdueStreak: 0 };
  }

  if (dueDate === null) {
    return { status: "open", overdueStreak: 0 };
  }

  let streak = 0;
  for (let i = timeline.length - 1; i >= 0; i--) {
    const ev = timeline[i];
    if (ev.type === "made") break;
    if (ev.meetingDate > dueDate) {
      streak += 1;
      continue;
    }
    break;
  }

  if (streak === 0) return { status: "open", overdueStreak: 0 };
  return { status: streak >= 2 ? "broken" : "at_risk", overdueStreak: streak };
}

export const STATUS_META: Record<
  CommitmentStatus,
  { label: string; color: string; dot: string }
> = {
  open: { label: "On track", color: "text-paper-dim", dot: "bg-paper-dim" },
  at_risk: { label: "At risk", color: "text-amber", dot: "bg-amber" },
  broken: { label: "Broken", color: "text-red", dot: "bg-red" },
  fulfilled: { label: "Fulfilled", color: "text-green", dot: "bg-green" },
};
