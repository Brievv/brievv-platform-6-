import { z } from "zod";

/**
 * Centralized, validated access to environment variables.
 * Import `env` instead of reading `process.env` directly anywhere
 * in server code — this fails fast at boot if something required
 * is missing, instead of failing silently mid-request.
 *
 * NOTE: this module must only be imported from server-side code
 * (API routes, server actions, server components). Secrets here
 * are never sent to the browser.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_TENANT_ID: z.string().optional(),

  AI_PROVIDER: z.enum(["anthropic", "openai"]).default("anthropic"),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("claude-sonnet-4-6"),
  AI_MAX_TOKENS: z.coerce.number().default(1200),
  AI_ESTIMATOR_TEMPERATURE: z.coerce.number().default(0.3),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PLATFORM_FEE_PERCENT: z.coerce.number().default(15),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().default("brievv-files"),
  S3_PUBLIC_BASE_URL: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("BRIEVV <notifications@brievv.com>"),

  REDIS_URL: z.string().optional(),
});

// In non-production dev/test we still want the app to boot (and Next.js
// to render pages) even if infra credentials aren't configured yet —
// individual services check for their own keys and degrade gracefully
// (see server/services/*). Only DATABASE_URL and AUTH_SECRET are hard
// requirements everywhere, since nothing works without them.
function loadEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment variables — see log above.");
    }
  }
  return parsed.success ? parsed.data : (process.env as unknown as z.infer<typeof serverEnvSchema>);
}

export const env = loadEnv();

export const isAiConfigured = () => Boolean(env.AI_API_KEY);
export const isStripeConfigured = () => Boolean(env.STRIPE_SECRET_KEY);
export const isStorageConfigured = () => Boolean(env.S3_ACCESS_KEY && env.S3_SECRET_KEY && env.S3_ENDPOINT);
export const isEmailConfigured = () => Boolean(env.RESEND_API_KEY);
