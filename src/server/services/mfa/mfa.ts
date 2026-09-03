import crypto from "crypto";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { env } from "@/lib/env";

/**
 * TOTP-based MFA. The secret stored on `User.mfaSecret` is symmetrically
 * encrypted at rest with AES-256-GCM, keyed from AUTH_SECRET — never
 * stored in plaintext, and never sent back to the browser after initial
 * setup (spec §25's "encrypted secrets" and §76's "MFA" account setting).
 *
 * Encryption key derivation: AUTH_SECRET is a base64 string of arbitrary
 * length (spec says `openssl rand -base64 32`); we SHA-256 it down to a
 * fixed 32-byte key so AES-256 always gets a correctly-sized key
 * regardless of how AUTH_SECRET was generated.
 */

function getEncryptionKey(): Buffer {
  return crypto.createHash("sha256").update(env.AUTH_SECRET).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Pack iv + authTag + ciphertext into one base64 string for storage.
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptSecret(packed: string): string {
  const buf = Buffer.from(packed, "base64");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export interface MfaSetup {
  /** Plaintext secret — shown to the user once via QR code, never persisted in plaintext. */
  secret: string;
  qrCodeDataUrl: string;
}

export async function generateMfaSetup(email: string): Promise<MfaSetup> {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, "BRIEVV", secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { secret, qrCodeDataUrl };
}

export function verifyTotpToken(token: string, encryptedSecret: string): boolean {
  try {
    const secret = decryptSecret(encryptedSecret);
    return authenticator.check(token, secret);
  } catch {
    return false;
  }
}
