import { NextRequest, NextResponse } from "next/server";
import { openSelfDm, postMessage } from "@/lib/slack";

export async function POST(req: NextRequest) {
  try {
    const { speaker, text, dueDate, overdueStreak } = await req.json();
    if (!speaker || !text) {
      return NextResponse.json({ error: "speaker and text are required" }, { status: 400 });
    }

    const channel = await openSelfDm();

    const urgency = overdueStreak >= 2 ? "This has slipped twice now." : "This is now overdue.";
    const message =
      `:wave: Witness here — following up for *${speaker}*.\n` +
      `> ${text}${dueDate ? ` (due ${dueDate})` : ""}\n` +
      `${urgency} Any update?`;

    const { ts } = await postMessage(channel, message);

    return NextResponse.json({ channel, ts });
  } catch (err) {
    console.error("slack notify error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
