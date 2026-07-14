import { createOpenAI } from "@ai-sdk/openai";

/**
 * Single OpenRouter client used by every AI node. OpenRouter exposes an
 * OpenAI-compatible Chat Completions API, so the `@ai-sdk/openai` provider
 * works against it by overriding the base URL.
 */
export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "local-placeholder-key",
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://kryptonite.app",
    "X-Title": "Kryptonite",
  },
});

/**
 * Free-tier OpenRouter model IDs. Each AI node type is mapped to a distinct
 * free model so the three "agent" nodes have different personalities/voices
 * while costing $0 to run.
 */
export const OPENROUTER_FREE_MODELS = {
  OPENAI: "openai/gpt-oss-20b:free",
  ANTHROPIC: "openai/gpt-oss-120b:free",
  GEMINI: "google/gemma-4-26b-a4b-it:free",
  MISTRAL: "liquid/lfm-2.5-1.2b-instruct:free",
  QWEN: "liquid/lfm-2.5-1.2b-instruct:free",
} as const;

export type OpenRouterAgentRole = keyof typeof OPENROUTER_FREE_MODELS;
