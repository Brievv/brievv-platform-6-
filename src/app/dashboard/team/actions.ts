"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Invites a teammate by email to the caller's organization. If no
 * organization exists yet for this user (e.g. they skipped entering a
 * company name during onboarding), this creates one on the fly named
 * after the inviter, so a team can still form.
 */
export async function inviteTeamMember(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { ok: false, error: "Enter a valid email." };

  let membership = await db.organizationMember.findFirst({ where: { userId } });
  if (!membership) {
    const me = await db.user.findUnique({ where: { id: userId } });
    const org = await db.organization.create({
      data: { name: `${me?.name ?? "My"}'s organization`, slug: `org-${userId.slice(0, 8)}` },
    });
    membership = await db.organizationMember.create({ data: { organizationId: org.id, userId, role: "CLIENT", joinedAt: new Date() } });
  }

  const invitedUser = await db.user.findUnique({ where: { email } });
  if (invitedUser) {
    await db.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: membership.organizationId, userId: invitedUser.id } },
      update: {},
      create: { organizationId: membership.organizationId, userId: invitedUser.id, role: "CLIENT" },
    });
  }
  // TODO: if invitedUser doesn't exist yet, send an invite email (spec §40)
  // once RESEND_API_KEY is configured — the membership row would then be
  // created once they complete sign-up with this email.

  revalidatePath("/dashboard/team");
  return { ok: true };
}
