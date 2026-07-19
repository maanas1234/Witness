import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAI, MODEL } from "@/lib/openai";

const ExtractedCommitmentSchema = z.object({
  speaker: z.string().describe("Name of the person who made the commitment"),
  text: z
    .string()
    .describe("Short, normalized description of the task committed to, third person, e.g. 'Send pricing deck to sales'"),
  dueDate: z
    .string()
    .nullable()
    .describe(
      "The due date/deadline mentioned, resolved to an ISO date (YYYY-MM-DD) relative to the meeting date if possible. Null if no deadline was given."
    ),
  quote: z.string().describe("The verbatim sentence from the transcript where the commitment was made"),
});

const ExtractionResultSchema = z.object({
  commitments: z.array(ExtractedCommitmentSchema),
});

export async function POST(req: NextRequest) {
  try {
    const { transcript, meetingLabel, meetingDate } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 });
    }

    const openai = getOpenAI();

    const completion = await openai.chat.completions.parse({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are Witness, an AI that extracts explicit personal commitments from meeting transcripts. " +
            "Only extract commitments where a specific person says they (or someone named) will personally do something — " +
            "not general team goals, opinions, or questions. Resolve relative dates ('by Friday', 'next week') into an ISO " +
            "date using the meeting date as the anchor. If no deadline is stated, use null.",
        },
        {
          role: "user",
          content: `Meeting: "${meetingLabel}" on ${meetingDate}\n\nTranscript:\n${transcript}`,
        },
      ],
      response_format: zodResponseFormat(ExtractionResultSchema, "extraction_result"),
      temperature: 0.1,
      max_tokens: 2000,
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
      return NextResponse.json({ error: "Model returned no parseable output" }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("extract error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
