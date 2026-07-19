import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

const LOCAL_WHISPER_URL = process.env.LOCAL_WHISPER_URL;

async function transcribeLocal(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${LOCAL_WHISPER_URL}/transcribe`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Local Whisper transcription failed");
  return data.text;
}

async function transcribeOpenAI(file: File): Promise<string> {
  const openai = getOpenAI();
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
  });
  return "text" in transcription ? transcription.text : String(transcription);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    // verbose_json / faster-whisper both lack diarization. The extraction prompt still
    // works fine on single-narrator or lightly-labeled text ("Rahul: ...") if present.
    const text = LOCAL_WHISPER_URL ? await transcribeLocal(file) : await transcribeOpenAI(file);

    return NextResponse.json({ text });
  } catch (err) {
    console.error("transcribe error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    const hint =
      LOCAL_WHISPER_URL || message.toLowerCase().includes("audio")
        ? message
        : `${message} — Whisper transcription requires a native OPENAI_API_KEY (OpenRouter does not proxy the audio endpoint), or set LOCAL_WHISPER_URL to use local Whisper instead.`;
    return NextResponse.json({ error: hint }, { status: 500 });
  }
}
