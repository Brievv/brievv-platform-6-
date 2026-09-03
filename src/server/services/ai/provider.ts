/**
 * Provider-agnostic AI interface. server/services/ai/estimator.ts and
 * document-analysis.ts depend only on this interface, never on a
 * specific vendor SDK — so swapping AI_PROVIDER in .env (anthropic ->
 * openai, or a future provider) requires no changes above this layer.
 */
export interface AIMessageRequest {
  system?: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIMessageResponse {
  text: string;
  model: string;
  raw: unknown; // retained for AIAnalysis.rawResponse audit trail
}

export interface AIProvider {
  readonly name: string;
  complete(req: AIMessageRequest): Promise<AIMessageResponse>;
}
