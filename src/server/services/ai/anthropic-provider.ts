import type { AIMessageRequest, AIMessageResponse, AIProvider } from "./provider";
import { env } from "@/lib/env";

/**
 * Calls Anthropic's Messages API. This module is only ever imported
 * from server-side code (API routes / server actions) — AI_API_KEY
 * never reaches a client bundle because Next.js only inlines env vars
 * prefixed NEXT_PUBLIC_, and this file has no "use client" directive
 * nor is it imported by one.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  async complete(req: AIMessageRequest): Promise<AIMessageResponse> {
    if (!env.AI_API_KEY) {
      throw new AIProviderUnavailableError("AI_API_KEY is not configured");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.AI_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        max_tokens: req.maxTokens ?? env.AI_MAX_TOKENS,
        temperature: req.temperature ?? env.AI_ESTIMATOR_TEMPERATURE,
        system: req.system,
        messages: [{ role: "user", content: req.prompt }],
      }),
      // Server-to-server call — 20s timeout via AbortSignal so a hung
      // AI request never hangs an HTTP request indefinitely.
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new AIProviderRequestError(`Anthropic API error ${response.status}: ${body}`);
    }

    const json = await response.json();
    const textBlock = (json.content ?? []).find((b: any) => b.type === "text");
    if (!textBlock) throw new AIProviderRequestError("No text content in Anthropic response");

    return { text: textBlock.text, model: json.model ?? env.AI_MODEL, raw: json };
  }
}

export class AIProviderUnavailableError extends Error {}
export class AIProviderRequestError extends Error {}
