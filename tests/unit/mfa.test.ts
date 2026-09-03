import { describe, it, expect } from "vitest";
import { authenticator } from "otplib";
import { encryptSecret, decryptSecret, verifyTotpToken } from "@/server/services/mfa/mfa";

describe("MFA secret encryption", () => {
  it("round-trips a secret through encrypt/decrypt unchanged", () => {
    const secret = authenticator.generateSecret();
    const encrypted = encryptSecret(secret);
    expect(encrypted).not.toBe(secret); // never stored in plaintext
    expect(decryptSecret(encrypted)).toBe(secret);
  });

  it("produces a different ciphertext each time (random IV) even for the same secret", () => {
    const secret = authenticator.generateSecret();
    const a = encryptSecret(secret);
    const b = encryptSecret(secret);
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe(secret);
    expect(decryptSecret(b)).toBe(secret);
  });

  it("fails to decrypt tampered ciphertext (GCM auth tag catches it)", () => {
    const secret = authenticator.generateSecret();
    const encrypted = encryptSecret(secret);
    const tampered = encrypted.slice(0, -4) + "abcd";
    expect(() => decryptSecret(tampered)).toThrow();
  });
});

describe("verifyTotpToken", () => {
  it("accepts a currently-valid code generated from the same secret", () => {
    const secret = authenticator.generateSecret();
    const encrypted = encryptSecret(secret);
    const validCode = authenticator.generate(secret);
    expect(verifyTotpToken(validCode, encrypted)).toBe(true);
  });

  it("rejects an incorrect code", () => {
    const secret = authenticator.generateSecret();
    const encrypted = encryptSecret(secret);
    expect(verifyTotpToken("000000", encrypted)).toBe(false);
  });

  it("rejects a code generated from a different secret", () => {
    const secretA = authenticator.generateSecret();
    const secretB = authenticator.generateSecret();
    const encryptedA = encryptSecret(secretA);
    const codeFromB = authenticator.generate(secretB);
    expect(verifyTotpToken(codeFromB, encryptedA)).toBe(false);
  });

  it("fails safely (returns false, does not throw) on malformed stored data", () => {
    expect(verifyTotpToken("123456", "not-valid-base64-or-ciphertext")).toBe(false);
  });
});
