import { describe, it, expect } from "vitest";
import { computePriceBand, clampAISuggestion, requiresHumanReview } from "@/server/services/pricing/pricing-engine";

describe("computePriceBand", () => {
  it("scales price up with complexity", () => {
    const simple = computePriceBand({
      basePriceCents: 100_000,
      complexity: "simple",
      urgency: "standard",
      disciplineCount: 1,
      requiresSpecialistLicense: false,
      platformMarginPercent: 20,
    });
    const large = computePriceBand({
      basePriceCents: 100_000,
      complexity: "large",
      urgency: "standard",
      disciplineCount: 1,
      requiresSpecialistLicense: false,
      platformMarginPercent: 20,
    });
    expect(large.lowCents).toBeGreaterThan(simple.lowCents);
    expect(large.highCents).toBeGreaterThan(simple.highCents);
  });

  it("scales price up with urgency", () => {
    const standard = computePriceBand({
      basePriceCents: 100_000,
      complexity: "medium",
      urgency: "standard",
      disciplineCount: 1,
      requiresSpecialistLicense: false,
      platformMarginPercent: 20,
    });
    const asap = computePriceBand({
      basePriceCents: 100_000,
      complexity: "medium",
      urgency: "asap",
      disciplineCount: 1,
      requiresSpecialistLicense: false,
      platformMarginPercent: 20,
    });
    expect(asap.lowCents).toBeGreaterThan(standard.lowCents);
  });

  it("adds coordination overhead for each additional discipline beyond the first", () => {
    const oneDiscipline = computePriceBand({
      basePriceCents: 100_000,
      complexity: "medium",
      urgency: "standard",
      disciplineCount: 1,
      requiresSpecialistLicense: false,
      platformMarginPercent: 20,
    });
    const threeDisciplines = computePriceBand({
      basePriceCents: 100_000,
      complexity: "medium",
      urgency: "standard",
      disciplineCount: 3,
      requiresSpecialistLicense: false,
      platformMarginPercent: 20,
    });
    expect(threeDisciplines.lowCents).toBeGreaterThan(oneDiscipline.lowCents);
  });

  it("adds a flat surcharge when specialist licensing is required", () => {
    const withoutLicense = computePriceBand({
      basePriceCents: 100_000,
      complexity: "simple",
      urgency: "standard",
      disciplineCount: 1,
      requiresSpecialistLicense: false,
      platformMarginPercent: 0,
    });
    const withLicense = computePriceBand({
      basePriceCents: 100_000,
      complexity: "simple",
      urgency: "standard",
      disciplineCount: 1,
      requiresSpecialistLicense: true,
      platformMarginPercent: 0,
    });
    expect(withLicense.breakdown.specialistSurchargeCents).toBeGreaterThan(0);
    expect(withLicense.lowCents).toBeGreaterThan(withoutLicense.lowCents);
  });

  it("widens the band for higher-complexity work (more estimating uncertainty)", () => {
    const simple = computePriceBand({
      basePriceCents: 100_000,
      complexity: "simple",
      urgency: "standard",
      disciplineCount: 1,
      requiresSpecialistLicense: false,
      platformMarginPercent: 20,
    });
    const large = computePriceBand({
      basePriceCents: 100_000,
      complexity: "large",
      urgency: "standard",
      disciplineCount: 1,
      requiresSpecialistLicense: false,
      platformMarginPercent: 20,
    });
    const simpleBandWidth = simple.highCents - simple.lowCents;
    const simpleBandPct = simpleBandWidth / ((simple.lowCents + simple.highCents) / 2);
    const largeBandWidth = large.highCents - large.lowCents;
    const largeBandPct = largeBandWidth / ((large.lowCents + large.highCents) / 2);
    expect(largeBandPct).toBeGreaterThan(simpleBandPct);
  });

  it("always returns lowCents <= highCents", () => {
    const result = computePriceBand({
      basePriceCents: 50_000,
      complexity: "large",
      urgency: "asap",
      disciplineCount: 5,
      requiresSpecialistLicense: true,
      platformMarginPercent: 35,
    });
    expect(result.lowCents).toBeLessThanOrEqual(result.highCents);
  });
});

describe("clampAISuggestion", () => {
  const ruleBand = computePriceBand({
    basePriceCents: 100_000,
    complexity: "medium",
    urgency: "standard",
    disciplineCount: 1,
    requiresSpecialistLicense: false,
    platformMarginPercent: 20,
  });

  it("passes through an AI suggestion that already sits inside the rules-based band", () => {
    const midpoint = Math.round((ruleBand.lowCents + ruleBand.highCents) / 2);
    const result = clampAISuggestion(midpoint - 1000, midpoint + 1000, ruleBand);
    expect(result.wasClamped).toBe(false);
    expect(result.lowCents).toBe(midpoint - 1000);
    expect(result.highCents).toBe(midpoint + 1000);
  });

  it("clamps an AI suggestion below the rules-based band up to the band's floor", () => {
    const result = clampAISuggestion(1, 100, ruleBand);
    expect(result.wasClamped).toBe(true);
    expect(result.lowCents).toBeGreaterThanOrEqual(ruleBand.lowCents);
    expect(result.highCents).toBeLessThanOrEqual(ruleBand.highCents);
  });

  it("clamps an AI suggestion above the rules-based band down to the band's ceiling", () => {
    const result = clampAISuggestion(ruleBand.highCents * 10, ruleBand.highCents * 20, ruleBand);
    expect(result.wasClamped).toBe(true);
    expect(result.highCents).toBeLessThanOrEqual(ruleBand.highCents);
  });

  it("never returns lowCents greater than highCents even with a nonsensical AI suggestion", () => {
    const result = clampAISuggestion(999_999_999, 1, ruleBand);
    expect(result.lowCents).toBeLessThanOrEqual(result.highCents);
  });
});

describe("requiresHumanReview", () => {
  it("always requires review for regulated/licensed work", () => {
    expect(requiresHumanReview({ complexity: "simple", requiresSpecialistLicense: true, priceHighCents: 1000 })).toBe(true);
  });

  it("always requires review for large-complexity work", () => {
    expect(requiresHumanReview({ complexity: "large", requiresSpecialistLicense: false, priceHighCents: 1000 })).toBe(true);
  });

  it("requires review above the $20,000 threshold regardless of complexity", () => {
    expect(requiresHumanReview({ complexity: "simple", requiresSpecialistLicense: false, priceHighCents: 2_000_001 })).toBe(true);
  });

  it("does not require review for small, simple, unlicensed work", () => {
    expect(requiresHumanReview({ complexity: "simple", requiresSpecialistLicense: false, priceHighCents: 50_000 })).toBe(false);
  });
});
