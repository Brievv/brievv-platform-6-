/**
 * Matching engine. Deliberately NOT AI-driven — matching quality is
 * dominated by structured attributes (skills, availability, jurisdiction,
 * track record, cost) that a weighted scoring function handles more
 * reliably and more auditably than an LLM call would. This mirrors the
 * estimator's own philosophy (see pricing-engine.ts): a human-configurable,
 * deterministic function is the thing making decisions; nothing here is
 * a black box.
 */

export const REGULATED_DISCIPLINES = new Set([
  "Architecture",
  "Structural Engineering",
  "Civil Engineering",
  "MEP Engineering",
]);

export interface MatchingWeights {
  skill: number;
  experience: number;
  availability: number;
  jurisdiction: number;
  quality: number;
  cost: number;
}

// Defaults straight from spec §22's example.
export const DEFAULT_WEIGHTS: MatchingWeights = {
  skill: 0.4,
  experience: 0.2,
  availability: 0.15,
  jurisdiction: 0.1,
  quality: 0.1,
  cost: 0.05,
};

export interface ProjectMatchInput {
  disciplines: string[];
  jurisdiction: string | null;
  budgetHighCents: number | null;
  deadline: Date | null;
}

export interface ProfessionalMatchInput {
  id: string;
  name: string;
  status: string; // ProfessionalStatus
  disciplines: string[];
  yearsExperience: number | null;
  jurisdictions: string[];
  hourlyRateCents: number | null;
  qualityScore: number | null; // 0-5
  completedProjects: number;
  licenseNumber: string | null;
  hasOpenAvailability: boolean;
}

export interface MatchResult {
  professionalId: string;
  name: string;
  score: number; // 0-100
  eligible: boolean;
  ineligibleReason?: string;
  breakdown: Record<keyof MatchingWeights, number>; // each 0-1 before weighting
}

/**
 * Never matches a professional to regulated work without verified
 * licensing (spec §22: "Never automatically assign professionals to
 * regulated work if required licensing has not been verified"). This is
 * enforced here, in the scoring function itself — a caller can't
 * accidentally bypass it by skipping a separate check, because an
 * ineligible professional is never given a score above 0 to begin with.
 */
function checkEligibility(project: ProjectMatchInput, pro: ProfessionalMatchInput): { eligible: boolean; reason?: string } {
  if (pro.status !== "ACTIVE" && pro.status !== "VERIFIED") {
    return { eligible: false, reason: "Professional is not verified/active" };
  }
  const needsRegulated = project.disciplines.some((d) => REGULATED_DISCIPLINES.has(d));
  const proCoversRegulated = project.disciplines.some((d) => REGULATED_DISCIPLINES.has(d) && pro.disciplines.includes(d));
  if (needsRegulated && proCoversRegulated && !pro.licenseNumber) {
    return { eligible: false, reason: "Regulated discipline requires a verified license on file" };
  }
  const hasAnyDisciplineOverlap = project.disciplines.some((d) => pro.disciplines.includes(d));
  if (!hasAnyDisciplineOverlap) {
    return { eligible: false, reason: "No overlapping disciplines" };
  }
  return { eligible: true };
}

function scoreSkill(project: ProjectMatchInput, pro: ProfessionalMatchInput): number {
  const overlap = project.disciplines.filter((d) => pro.disciplines.includes(d)).length;
  return project.disciplines.length > 0 ? overlap / project.disciplines.length : 0;
}

function scoreExperience(pro: ProfessionalMatchInput): number {
  const years = pro.yearsExperience ?? 0;
  return Math.min(1, years / 12); // 12+ years reaches full score
}

function scoreAvailability(pro: ProfessionalMatchInput): number {
  return pro.hasOpenAvailability ? 1 : 0.3; // not zero — a busy pro can still be proposed, just ranked lower
}

function scoreJurisdiction(project: ProjectMatchInput, pro: ProfessionalMatchInput): number {
  if (!project.jurisdiction) return 1; // no jurisdiction requirement stated
  return pro.jurisdictions.includes(project.jurisdiction) ? 1 : 0.2;
}

function scoreQuality(pro: ProfessionalMatchInput): number {
  if (pro.qualityScore === null) return pro.completedProjects > 0 ? 0.5 : 0.4; // neutral prior for no reviews yet
  return Math.min(1, pro.qualityScore / 5);
}

function scoreCost(project: ProjectMatchInput, pro: ProfessionalMatchInput): number {
  if (!project.budgetHighCents || !pro.hourlyRateCents) return 0.7; // neutral when we can't compare
  // Rough heuristic: assume ~40 billable hours per $1 of budgetHigh scale —
  // this is intentionally simple; a real cost-fit model belongs in
  // PricingRule alongside the estimator, not hardcoded here.
  const impliedAffordableRateCents = project.budgetHighCents / 40;
  return pro.hourlyRateCents <= impliedAffordableRateCents ? 1 : Math.max(0, 1 - (pro.hourlyRateCents - impliedAffordableRateCents) / impliedAffordableRateCents);
}

export function scoreProfessional(
  project: ProjectMatchInput,
  pro: ProfessionalMatchInput,
  weights: MatchingWeights = DEFAULT_WEIGHTS
): MatchResult {
  const eligibility = checkEligibility(project, pro);
  const breakdown: Record<keyof MatchingWeights, number> = {
    skill: scoreSkill(project, pro),
    experience: scoreExperience(pro),
    availability: scoreAvailability(pro),
    jurisdiction: scoreJurisdiction(project, pro),
    quality: scoreQuality(pro),
    cost: scoreCost(project, pro),
  };

  if (!eligibility.eligible) {
    return { professionalId: pro.id, name: pro.name, score: 0, eligible: false, ineligibleReason: eligibility.reason, breakdown };
  }

  const score =
    breakdown.skill * weights.skill +
    breakdown.experience * weights.experience +
    breakdown.availability * weights.availability +
    breakdown.jurisdiction * weights.jurisdiction +
    breakdown.quality * weights.quality +
    breakdown.cost * weights.cost;

  return { professionalId: pro.id, name: pro.name, score: Math.round(score * 100), eligible: true, breakdown };
}

export function rankProfessionals(
  project: ProjectMatchInput,
  candidates: ProfessionalMatchInput[],
  weights: MatchingWeights = DEFAULT_WEIGHTS
): MatchResult[] {
  return candidates
    .map((c) => scoreProfessional(project, c, weights))
    .sort((a, b) => b.score - a.score);
}
