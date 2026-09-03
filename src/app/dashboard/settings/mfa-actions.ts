"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateMfaSetup, encryptSecret, verifyTotpToken } from "@/server/services/mfa/mfa";

/**
 * Step 1: generate a new TOTP secret + QR code. NOT persisted yet — the
 * secret only gets saved (encrypted) once the user proves they scanned it
 * correctly by submitting a valid code in confirmMfaSetup(). This avoids
 * ever locking a user into MFA with a secret they never actually saved
 * in their authenticator app.
 */
export async function startMfaSetup(): Promise<{ ok: true; secret: string; qrCodeDataUrl: string } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const setup = await generateMfaSetup(session.user.email ?? "");
  return { ok: true, secret: setup.secret, qrCodeDataUrl: setup.qrCodeDataUrl };
}

export async function confirmMfaSetup(plaintextSecret: string, token: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;

  const encrypted = encryptSecret(plaintextSecret);
  const valid = verifyTotpToken(token, encrypted);
  if (!valid) return { ok: false, error: "That code didn't match. Check your authenticator app and try again." };

  await db.user.update({ where: { id: userId }, data: { mfaEnabled: true, mfaSecret: encrypted } });
  await db.auditLog.create({ data: { actorId: userId, action: "user.mfa_enabled", entityType: "User", entityId: userId } });

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function disableMfa(currentPassword: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) return { ok: false, error: "No password set on this account." };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { ok: false, error: "Incorrect password." };

  await db.user.update({ where: { id: userId }, data: { mfaEnabled: false, mfaSecret: null } });
  await db.auditLog.create({ data: { actorId: userId, action: "user.mfa_disabled", entityType: "User", entityId: userId } });

  revalidatePath("/dashboard/settings");
  return { ok: true };
}
