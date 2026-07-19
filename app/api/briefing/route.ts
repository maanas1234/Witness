import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOpenAI, MODEL } from "@/lib/openai";

const CommitmentInput = z.object({
  speaker: z.string(),
  text: z.string(),
  dueDate: z.string().nullable(),
  status: z.string(),
  overdueStreak: z.number(),
  originMeetingLabel: z.string(),
});

const BriefingRequestSchema = z.object({
  nextMeetingLabel: z.string(),
  commitments: z.array(CommitmentInput),
});

export async function POST(req: NextRequest) {
  try {
    const body = BriefingRequestSchema.parse(await req.json());

    if (body.commitments.length === 0) {
      return NextResponse.json({
        briefing: "Nothing at risk right now — every open commitment is on track. Nothing to flag before this meeting.",
      });
    }

    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are Witness, an accountability copilot. Write a short, direct pre-meeting briefing (markdown, use bullet " +
            "points and bold names) for a meeting lead, based on commitments that are at_risk or broken. Be specific: name " +
            "who owes what, since which meeting, and how many meetings it has slipped. Order by severity (most overdue " +
            "first). End with one blunt one-line recommendation for how to open the meeting. Keep it under 160 words. " +
            "No preamble, start directly with the briefing.",
        },
        {
          role: "user",
          content:
            `Upcoming meeting: "${body.nextMeetingLabel}"\n\n` +
            `Commitments needing attention:\n${JSON.stringify(body.commitments, null, 2)}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 500,
    });

    const briefing = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ briefing });
  } catch (err) {
    console.error("briefing error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
