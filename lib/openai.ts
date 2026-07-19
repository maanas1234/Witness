import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (openaiKey) {
      client = new OpenAI({ apiKey: openaiKey });
    } else if (openrouterKey) {
      client = new OpenAI({
        apiKey: openrouterKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "X-Title": "Witness",
        },
      });
    } else {
      throw new Error("Set OPENAI_API_KEY or OPENROUTER_API_KEY");
    }
  }
  return client;
}

export const MODEL = process.env.WITNESS_MODEL || "gpt-4.1-mini";
