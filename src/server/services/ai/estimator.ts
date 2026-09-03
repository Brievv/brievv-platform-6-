import { z } from "zod";
import { getAIProvider } from "./index";
import { computePriceBand, clampAISuggestion, requiresHumanReview, type ComplexityTier, type Urgency } from "@/server/services/pricing/pricing-engine";
import { db } from "@/lib/db";

/**
 * Full pipeline (spec §10):
 *   client brief -> validation -> classification -> complexity scoring ->
 *   pricing rules engine -> AI reasoning -> risk adjustment ->
 *   human-review threshold -> final quote
 *
 * The AI is asked to reason about scope, team, timeline, assumptions and
 * risks, and to *suggest* a price band — but computePriceBand() (a pure,
 * deterministic function fed by admin-configurable rules) sets the actual
 * boundaries the client can be quoted, and clampAISuggestion() forces the
 * AI's number inside them. See src/server/services/pricing/pricing-engine.ts.
 */

export const briefInputSchema = z.object({
  title: z.string().min(3),
  disciplines: z.array(z.string()).min(1),
  scopeDescription: z.string().min(10),
  projectType: z.string().optional(),
  jurisdiction: z.string().optional(),
  requiredSoftware: z.array(z.string()).optional(),
  requiresLicense: z.boolean().default(false),
  urgency: z.enum(["standard", "rush", "asap"]).default("standard"),
  budgetLowCents: z.number().optional(),
  budgetHighCents: z.number().optional(),
});
export type BriefInput = z.infer<typeof briefInputSchema>;

const aiEstimateSchema = z.object({
  complexity: z.enum(["simple", "medium", "large"]),
  price_low: z.number(),
  price_high: z.number(),
  timeline: z.string(),
  team: z.array(z.string()),
  scope_summary: z.string(),
  assumptions: z.array(z.string()),
  missing_information: z.array(z.string()).default([]),
  risks: z.array(z.string()),
});
export type EstimateResult = {
  status: "READY" | "AI_ANALYSIS_PENDING";
  priceLowCents: number;
  priceHighCents: number;
  exactPriceCents: number;
  timelineText: string;
  recommendedTeam: string[];
  scopeSummary: string;
  assumptions: string[];
  missingInformation: string[];
  risks: string[];
  requiresHumanReview: boolean;
  wasClamped: boolean;
  rawModelResponse?: unknown;
};

const FALLBACK_BASE_PRICE_CENTS = 80_000; // $800 baseline unit — used only if no active PricingRule exists yet
const FALLBACK_PLATFORM_MARGIN_PERCENT = 20;

/**
 * Reads the active, admin-configured base price and margin from the
 * PricingRule table (spec §41 — admins configure this from /admin/pricing-
 * rules without a redeploy). Looks for a discipline-specific rule first
 * (matching any of the brief's disciplines), then falls back to a global
 * rule (disciplineSlug: null), then to hardcoded defaults if the table is
 * empty (e.g. a fresh install before any rule has been created).
 */
async function resolvePricingConfig(disciplines: string[]): Promise<{ basePriceCents: number; platformMarginPercent: number }> {
  const slugs = disciplines.map((d) => d.toLowerCase().replace(/[^a-z0-9]+/g, "-"));

  const specific = await db.pricingRule.findFirst({
    where: { isActive: true, disciplineSlug: { in: slugs } },
    orderBy: { updatedAt: "desc" },
  });
  if (specific) return { basePriceCents: specific.basePriceCents, platformMarginPercent: specific.platformMarginPercent };

  const global = await db.pricingRule.findFirst({
    where: { isActive: true, disciplineSlug: null },
    orderBy: { updatedAt: "desc" },
  });
  if (global) return { basePriceCents: global.basePriceCents, platformMarginPercent: global.platformMarginPercent };

  return { basePriceCents: FALLBACK_BASE_PRICE_CENTS, platformMarginPercent: FALLBACK_PLATFORM_MARGIN_PERCENT };
}

export async function generateEstimate(input: BriefInput): Promise<EstimateResult> {
  const brief = briefInputSchema.parse(input);

  const prompt = buildEstimatorPrompt(brief);
  const pricingConfig = await resolvePricingConfig(brief.disciplines);

  try {
    const provider = getAIProvider();
    const response = await provider.complete({
      system:
        "You are BRIEVV's estimation assistant for AEC (architecture, engineering, construction) projects. " +
        "Respond with ONLY a raw JSON object matching the requested shape — no prose, no markdown fences. " +
        "You provide a recommendation; you do not set final pricing policy.",
      prompt,
    });

    const cleaned = response.text.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
    const parsedJson = JSON.parse(cleaned);
    const ai = aiEstimateSchema.parse(parsedJson);

    const ruleBand = computePriceBand({
      basePriceCents: pricingConfig.basePriceCents,
      complexity: ai.complexity as ComplexityTier,
      urgency: brief.urgency as Urgency,
      disciplineCount: brief.disciplines.length,
      requiresSpecialistLicense: brief.requiresLicense,
      platformMarginPercent: pricingConfig.platformMarginPercent,
    });

    const clamped = clampAISuggestion(ai.price_low, ai.price_high, ruleBand);
    const exactPriceCents = Math.round((clamped.lowCents + clamped.highCents) / 2);

    return {
      status: "READY",
      priceLowCents: exactPriceCents,
      priceHighCents: exactPriceCents,
      exactPriceCents,
      timelineText: ai.timeline,
      recommendedTeam: ai.team,
      scopeSummary: ai.scope_summary,
      assumptions: ai.assumptions,
      missingInformation: ai.missing_information,
      risks: ai.risks,
      requiresHumanReview: requiresHumanReview({
        complexity: ai.complexity as ComplexityTier,
        requiresSpecialistLicense: brief.requiresLicense,
        priceHighCents: clamped.highCents,
      }),
      wasClamped: clamped.wasClamped,
      rawModelResponse: response.raw,
    };
  } catch (err) {
    // spec §46 — AI failure fallback. The brief itself must already be
    // persisted by the caller BEFORE this function runs; this function
    // only ever returns a "pending" status, it never throws data away.
    // eslint-disable-next-line no-console
    console.error("Estimator AI call failed, falling back to manual review:", err);

    return {
      status: "AI_ANALYSIS_PENDING",
      priceLowCents: 0,
      priceHighCents: 0,
      exactPriceCents: 0,
      timelineText: "Pending manual estimate",
      recommendedTeam: [],
      scopeSummary: brief.scopeDescription.slice(0, 280),
      assumptions: [],
      missingInformation: [],
      risks: [],
      requiresHumanReview: true,
      wasClamped: false,
    };
  }
}

function buildEstimatorPrompt(brief: BriefInput): string {
  return `Return ONLY a JSON object with exactly this shape:
{
  "complexity": "simple" | "medium" | "large",
  "price_low": number (USD),
  "price_high": number (USD),
  "timeline": string,
  "team": string[],
  "scope_summary": string (2-3 sentences),
  "assumptions": string[],
  "missing_information": string[],
  "risks": string[]
}

Project title: ${brief.title}
Disciplines requested: ${brief.disciplines.join(", ")}
Project type: ${brief.projectType ?? "not specified"}
Scope description: ${brief.scopeDescription}
Jurisdiction: ${brief.jurisdiction ?? "not specified"}
Required software: ${(brief.requiredSoftware ?? []).join(", ") || "none specified"}
Urgency: ${brief.urgency}
Client's stated budget: ${
    brief.budgetLowCents && brief.budgetHighCents
      ? `$${brief.budgetLowCents / 100}–$${brief.budgetHighCents / 100}`
      : "not specified"
  }

Your price_low/price_high is a recommendation only — the platform's pricing
rules engine will clamp it into an approved band. Focus your reasoning on
correctly classifying complexity, identifying real risks/missing information,
and recommending an accurate team and timeline.`;
}
