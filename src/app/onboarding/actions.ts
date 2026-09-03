"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Completes client onboarding (spec §52): company setup + role, in one
 * short step. Team invitations are deliberately left for the dashboard's
 * "Team" page (post-onboarding) rather than blocking the first project —
 * the spec says "make onboarding short."
 */
export async function completeOnboarding(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;

  const companyName = String(formData.get("companyName") ?? "").trim();
  const jobTitle = String(formData.get("jobTitle") ?? "").trim();
  const projectInterest = String(formData.get("projectInterest") ?? "").trim();

  await db.$transaction(async (tx: any) => {
    await tx.clientProfile.upsert({
      where: { userId },
      update: { companyName: companyName || undefined, jobTitle: jobTitle || undefined },
      create: { userId, companyName: companyName || undefined, jobTitle: jobTitle || undefined },
    });

    if (companyName) {
      const slug = slugify(companyName) + "-" + userId.slice(0, 6);
      const org = await tx.organization.upsert({
        where: { slug },
        update: {},
        create: { name: companyName, slug },
      });
      await tx.organizationMember.upsert({
        where: { organizationId_userId: { organizationId: org.id, userId } },
        update: {},
        create: { organizationId: org.id, userId, role: "CLIENT", joinedAt: new Date() },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: "user.onboarding_completed",
        entityType: "User",
        entityId: userId,
        metadata: { projectInterest: projectInterest || undefined },
      },
    });
  });

  if (projectInterest === "start_now") {
    redirect("/start");
  }
  redirect("/dashboard");
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
