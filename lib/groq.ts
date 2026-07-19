import OpenAI from "openai";

let client: OpenAI | null = null;

export function getGroq(): OpenAI {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");
    client = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
  }
  return client;
}

export const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
