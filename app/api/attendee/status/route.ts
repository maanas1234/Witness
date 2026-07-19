import { NextRequest, NextResponse } from "next/server";
import { getBot, getTranscript, isTerminalState, transcriptToText } from "@/lib/attendee";

export async function GET(req: NextRequest) {
  try {
    const botId = req.nextUrl.searchParams.get("botId");
    if (!botId) {
      return NextResponse.json({ error: "botId is required" }, { status: 400 });
    }

    const bot = await getBot(botId);

    if (!isTerminalState(bot.state)) {
      return NextResponse.json({ state: bot.state, done: false });
    }

    if (bot.state !== "ended") {
      return NextResponse.json({
        state: bot.state,
        done: true,
        error: `Bot ended in state "${bot.state}" instead of "ended" — it may not have been able to join.`,
      });
    }

    const utterances = await getTranscript(botId);
    const text = transcriptToText(utterances);
    return NextResponse.json({ state: bot.state, done: true, text });
  } catch (err) {
    console.error("attendee status error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
