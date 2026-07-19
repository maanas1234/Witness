import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepliesAfter } from "@/lib/slack";
import { getGroq, GROQ_MODEL } from "@/lib/groq";

const ClassifySchema = z.object({
  outcome: z.enum(["fulfilled", "still_working", "unclear"]),
  note: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const { channel, afterTs, commitmentText } = await req.json();
    if (!channel || !afterTs) {
      return NextResponse.json({ error: "channel and afterTs are required" }, { status: 400 });
    }

    const replies = await getRepliesAfter(channel, afterTs);
    if (replies.length === 0) {
      return NextResponse.json({ found: false });
    }

    const replyText = replies.map((r) => r.text).join("\n");

    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Classify a Slack reply to an accountability nudge about a specific commitment. " +
            "'fulfilled' = they say it's done. 'still_working' = they acknowledge it's pending, give " +
            "an update, or ask for more time. 'unclear' = the reply doesn't actually address it. " +
            "'note' is one short clause summarizing the reply for a timeline. " +
            'Respond with ONLY a JSON object: {"outcome": "...", "note": "..."}',
        },
        {
          role: "user",
          content: `Commitment: "${commitmentText}"\n\nReply: "${replyText}"`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 300,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = ClassifySchema.parse(JSON.parse(raw));

    return NextResponse.json({ found: true, replyText, ...parsed });
  } catch (err) {
    console.error("slack check-reply error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
