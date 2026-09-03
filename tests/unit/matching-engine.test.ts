import { describe, it, expect } from "vitest";
import { scoreProfessional, rankProfessionals, DEFAULT_WEIGHTS, type ProjectMatchInput, type ProfessionalMatchInput } from "@/server/services/matching/matching-engine";

const baseProject: ProjectMatchInput = {
  disciplines: ["Structural Engineering"],
  jurisdiction: "US-CA",
  budgetHighCents: 500_000,
  deadline: null,
};

function makePro(overrides: Partial<ProfessionalMatchInput> = {}): ProfessionalMatchInput {
  return {
    id: "pro-1",
    name: "Test Professional",
    status: "ACTIVE",
    disciplines: ["Structural Engineering"],
    yearsExperience: 8,
    jurisdictions: ["US-CA"],
    hourlyRateCents: 8000,
    qualityScore: 4.5,
    completedProjects: 10,
    licenseNumber: null,
    hasOpenAvailability: true,
    ...overrides,
  };
}

describe("scoreProfessional — regulated-work safety gate", () => {
  it("never scores an unlicensed professional above 0 for a regulated discipline", () => {
    const pro = makePro({ licenseNumber: null });
    const result = scoreProfessional(baseProject, pro);
    expect(result.eligible).toBe(false);
    expect(result.score).toBe(0);
    expect(result.ineligibleReason).toMatch(/license/i);
  });

  it("allows a licensed professional to be scored normally for a regulated discipline", () => {
    const pro = makePro({ licenseNumber: "PE-12345" });
    const result = scoreProfessional(baseProject, pro);
    expect(result.eligible).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it("does not require a license for non-regulated disciplines", () => {
    const project: ProjectMatchInput = { ...baseProject, disciplines: ["CAD / Drafting"] };
    const pro = makePro({ disciplines: ["CAD / Drafting"], licenseNumber: null });
    const result = scoreProfessional(project, pro);
    expect(result.eligible).toBe(true);
  });

  it("rejects professionals who are not VERIFIED or ACTIVE, even if licensed", () => {
    const pro = makePro({ licenseNumber: "PE-12345", status: "APPLIED" });
    const result = scoreProfessional(baseProject, pro);
    expect(result.eligible).toBe(false);
  });

  it("rejects professionals with no overlapping disciplines", () => {
    const pro = makePro({ disciplines: ["Interior Design"], licenseNumber: null });
    const result = scoreProfessional(baseProject, pro);
    expect(result.eligible).toBe(false);
    expect(result.ineligibleReason).toMatch(/discipline/i);
  });
});

describe("scoreProfessional — weighting", () => {
  it("scores a perfectly-matched, highly experienced professional near the top of the range", () => {
    const pro = makePro({ licenseNumber: "PE-1", yearsExperience: 20, qualityScore: 5, hasOpenAvailability: true });
    const result = scoreProfessional(baseProject, pro);
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it("scores a junior, unavailable, out-of-jurisdiction professional lower than an ideal match", () => {
    const idealPro = makePro({ licenseNumber: "PE-1", yearsExperience: 15, qualityScore: 5, hasOpenAvailability: true, jurisdictions: ["US-CA"] });
    const weakPro = makePro({
      licenseNumber: "PE-2",
      yearsExperience: 1,
      qualityScore: 2,
      hasOpenAvailability: false,
      jurisdictions: ["US-NY"],
    });
    const idealResult = scoreProfessional(baseProject, idealPro);
    const weakResult = scoreProfessional(baseProject, weakPro);
    expect(idealResult.score).toBeGreaterThan(weakResult.score);
  });

  it("respects custom weights — a skill-only weighting ignores experience differences", () => {
    const skillOnlyWeights = { skill: 1, experience: 0, availability: 0, jurisdiction: 0, quality: 0, cost: 0 };
    const junior = makePro({ licenseNumber: "PE-1", yearsExperience: 1 });
    const senior = makePro({ licenseNumber: "PE-2", yearsExperience: 20 });
    const juniorResult = scoreProfessional(baseProject, junior, skillOnlyWeights);
    const seniorResult = scoreProfessional(baseProject, senior, skillOnlyWeights);
    expect(juniorResult.score).toBe(seniorResult.score);
  });

  it("weights sum to produce a score between 0 and 100 for any eligible professional", () => {
    const pro = makePro({ licenseNumber: "PE-1" });
    const result = scoreProfessional(baseProject, pro, DEFAULT_WEIGHTS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe("rankProfessionals", () => {
  it("sorts candidates by score descending", () => {
    const strong = makePro({ id: "strong", licenseNumber: "PE-1", yearsExperience: 20, qualityScore: 5 });
    const weak = makePro({ id: "weak", licenseNumber: "PE-2", yearsExperience: 1, qualityScore: 2, hasOpenAvailability: false });
    const results = rankProfessionals(baseProject, [weak, strong]);
    expect(results[0]?.professionalId).toBe("strong");
    expect(results[1]?.professionalId).toBe("weak");
  });

  it("places ineligible candidates at the bottom (score 0)", () => {
    const eligible = makePro({ id: "eligible", licenseNumber: "PE-1" });
    const ineligible = makePro({ id: "ineligible", licenseNumber: null });
    const results = rankProfessionals(baseProject, [ineligible, eligible]);
    expect(results[0]?.professionalId).toBe("eligible");
    expect(results[1]?.score).toBe(0);
  });
});
