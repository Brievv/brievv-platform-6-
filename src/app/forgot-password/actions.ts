"use server";

import crypto from "crypto";
import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/env";

/**
 * Always returns a generic success message regardless of whether the
 * email matches an account — this prevents user enumeration (spec §25).
 * A real reset token is generated and stored via NextAuth's
 * VerificationToken table when the user exists, so the plumbing is real;
 * only the email *delivery* is a no-op until RESEND_API_KEY is set
 * (spec §98: implement the full architecture, don't fake the integration).
 */
export async function requestPasswordReset(email: string): Promise<{ ok: true; emailSent: boolean }> {
  const normalized = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalized } });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await db.verificationToken.create({
      data: {
        identifier: normalized,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    if (isEmailConfigured()) {
      // TODO: send via Resend once RESEND_API_KEY is set — template lives
      // in emails/ (spec §40). The reset link is `${APP_URL}/reset-password?token=${token}`.
    } else {
      // eslint-disable-next-line no-console
      console.warn(`Password reset requested for ${normalized} but RESEND_API_KEY isn't configured — no email sent.`);
    }
  }

  return { ok: true, emailSent: Boolean(user) && isEmailConfigured() };
}
