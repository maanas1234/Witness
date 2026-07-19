import { NextRequest, NextResponse } from "next/server";
import { createBot } from "@/lib/attendee";

export async function POST(req: NextRequest) {
  try {
    const { meetingUrl, botName } = await req.json();
    if (!meetingUrl || typeof meetingUrl !== "string") {
      return NextResponse.json({ error: "meetingUrl is required" }, { status: 400 });
    }
    const bot = await createBot(meetingUrl, botName || "Witness");
    return NextResponse.json({ botId: bot.id, state: bot.state });
  } catch (err) {
    console.error("attendee join error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
