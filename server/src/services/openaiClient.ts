// server/src/services/openaiClient.ts
import "dotenv/config";
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "[Revenuela] Warning: OPENAI_API_KEY is not set. The AI agent will fail until it is configured."
  );
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});
