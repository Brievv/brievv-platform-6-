import { describe, it, expect } from "vitest";
import { formatCents, formatReferenceCode, cn } from "@/lib/utils";

describe("formatCents", () => {
  it("formats whole-dollar amounts without decimals", () => {
    expect(formatCents(125_000)).toBe("$1,250");
  });

  it("returns an em-dash for null or undefined", () => {
    expect(formatCents(null)).toBe("—");
    expect(formatCents(undefined)).toBe("—");
  });

  it("returns an em-dash for NaN", () => {
    expect(formatCents(NaN)).toBe("—");
  });

  it("handles zero correctly", () => {
    expect(formatCents(0)).toBe("$0");
  });

  it("supports a non-USD currency", () => {
    const result = formatCents(100_000, "EUR");
    expect(result).toContain("1,000");
  });
});

describe("formatReferenceCode", () => {
  it("pads the sequence number to 6 digits", () => {
    expect(formatReferenceCode(42, 2026)).toBe("BRV-2026-000042");
  });

  it("handles a 6-digit sequence without truncation", () => {
    expect(formatReferenceCode(123456, 2026)).toBe("BRV-2026-123456");
  });

  it("defaults to the current year when none is given", () => {
    const result = formatReferenceCode(1);
    expect(result).toMatch(/^BRV-\d{4}-000001$/);
  });
});

describe("cn (className merge)", () => {
  it("merges class strings and resolves Tailwind conflicts (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
