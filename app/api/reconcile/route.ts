import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAI, MODEL } from "@/lib/openai";

const OpenCommitmentInput = z.object({
  id: z.string(),
  speaker: z.string(),
  text: z.string(),
  dueDate: z.string().nullable(),
});

const UpdateSchema = z.object({
  id: z.string().describe("The id of the open commitment this update refers to"),
  outcome: z
    .enum(["fulfilled", "reaffirmed", "silent"])
    .describe(
      "fulfilled = speaker confirms it's done; reaffirmed = it comes up again but still pending/promised again; silent = not mentioned at all in this transcript"
    ),
  evidenceQuote: z.string().nullable().describe("Verbatim quote showing the outcome, null if silent"),
  note: z.string().describe("One short clause explaining the outcome"),
});

const NewCommitmentSchema = z.object({
  speaker: z.string(),
  text: z.string(),
  dueDate: z.string().nullable(),
  quote: z.string(),
});

const ReconcileResultSchema = z.object({
  updates: z.array(UpdateSchema),
  newCommitments: z.array(NewCommitmentSchema),
});

export async function POST(req: NextRequest) {
  try {
    const { transcript, meetingLabel, meetingDate, openCommitments } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 });
    }

    const parsedOpen = z.array(OpenCommitmentInput).parse(openCommitments ?? []);

    const openai = getOpenAI();

    const completion = await openai.chat.completions.parse({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are Witness, an AI that cross-references a new meeting transcript against a list of previously made, " +
            "still-open commitments. For EVERY open commitment given, decide its outcome in this transcript: " +
            "'fulfilled' if the speaker (or someone) confirms it is done, 'reaffirmed' if it is discussed again but still " +
            "pending or re-promised, or 'silent' if it is not mentioned at all. You must return exactly one update per " +
            "open commitment provided, matched by id. Separately, extract any NEW personal commitments made in this " +
            "transcript that are not already in the open list, resolving relative dates against the meeting date.",
        },
        {
          role: "user",
          content:
            `Meeting: "${meetingLabel}" on ${meetingDate}\n\n` +
            `Open commitments from previous meetings:\n${JSON.stringify(parsedOpen, null, 2)}\n\n` +
            `Transcript:\n${transcript}`,
        },
      ],
      response_format: zodResponseFormat(ReconcileResultSchema, "reconcile_result"),
      temperature: 0.1,
      max_tokens: 3000,
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
      return NextResponse.json({ error: "Model returned no parseable output" }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("reconcile error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
