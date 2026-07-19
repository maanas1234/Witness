import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOpenAI, MODEL } from "@/lib/openai";

const ChatRequestSchema = z.object({
  question: z.string().min(1),
  commitments: z.array(
    z.object({
      speaker: z.string(),
      text: z.string(),
      dueDate: z.string().nullable(),
      status: z.string(),
      overdueStreak: z.number(),
      originMeetingLabel: z.string(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const body = ChatRequestSchema.parse(await req.json());

    if (body.commitments.length === 0) {
      return NextResponse.json({ answer: "No commitments tracked yet — process a meeting first." });
    }

    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are Witness, an accountability copilot. Answer questions about the commitment ledger " +
            "below using ONLY the data given — never invent commitments, dates, or outcomes that aren't " +
            "listed. Be direct and specific: name people and commitments. If the answer isn't in the data, " +
            "say so plainly. Keep answers under 80 words unless the question needs a list.",
        },
        {
          role: "user",
          content: `Commitment ledger:\n${JSON.stringify(body.commitments, null, 2)}\n\nQuestion: ${body.question}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 400,
    });

    const answer = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("chat error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
