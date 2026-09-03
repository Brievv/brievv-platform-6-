import type { AIProvider } from "./provider";
import { AnthropicProvider } from "./anthropic-provider";
import { env } from "@/lib/env";

export * from "./provider";

/**
 * Returns the configured AI provider. Adding a new vendor: implement
 * AIProvider in a new file (e.g. openai-provider.ts) and add a case
 * here — nothing else in the codebase needs to change.
 */
export function getAIProvider(): AIProvider {
  switch (env.AI_PROVIDER) {
    case "anthropic":
      return new AnthropicProvider();
    case "openai":
      throw new Error("OpenAI provider not yet implemented — add src/server/services/ai/openai-provider.ts");
    default:
      throw new Error(`Unknown AI_PROVIDER: ${env.AI_PROVIDER}`);
  }
}
