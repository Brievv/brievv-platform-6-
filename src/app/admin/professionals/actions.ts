"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { notify } from "@/server/services/notifications/notify";

async function notifyProfessional(professionalId: string, type: string, title: string, body: string) {
  const profile = await db.professionalProfile.findUnique({ where: { id: professionalId }, select: { userId: true } });
  if (profile) {
    await notify({ userId: profile.userId, type, title, body, link: "/pro" });
  }
}

async function requireOpsSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Sign in required.");
  const role = (session.user as any).role;
  assertCan(role, "professional.verify");
  return session;
}

export async function approveProfessional(professionalId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireOpsSession();
    const actorId = (session.user as any).id as string;

    await db.$transaction([
      db.professionalProfile.update({ where: { id: professionalId }, data: { status: "ACTIVE" } }),
      db.professionalVerification.upsert({
        where: { professionalId },
        update: { status: "VERIFIED", reviewedByUserId: actorId, decidedAt: new Date() },
        create: { professionalId, status: "VERIFIED", reviewedByUserId: actorId, decidedAt: new Date(), documentsStorageKeys: [] },
      }),
      db.auditLog.create({ data: { actorId, action: "professional.approved", entityType: "ProfessionalProfile", entityId: professionalId } }),
    ]);

    revalidatePath("/admin/professionals");
    await notifyProfessional(professionalId, "professional_approved", "You're verified!", "Your BRIEVV application has been approved — you're now eligible for project matching.");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not approve." };
  }
}

export async function rejectProfessional(professionalId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireOpsSession();
    const actorId = (session.user as any).id as string;

    await db.$transaction([
      db.professionalProfile.update({ where: { id: professionalId }, data: { status: "REJECTED" } }),
      db.auditLog.create({ data: { actorId, action: "professional.rejected", entityType: "ProfessionalProfile", entityId: professionalId } }),
    ]);

    revalidatePath("/admin/professionals");
    await notifyProfessional(professionalId, "professional_rejected", "Application update", "Your BRIEVV application was not approved at this time.");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not reject." };
  }
}

export async function requestDocuments(professionalId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireOpsSession();
    const actorId = (session.user as any).id as string;

    await db.professionalProfile.update({ where: { id: professionalId }, data: { status: "DOCUMENTS_REQUIRED" } });
    await db.auditLog.create({ data: { actorId, action: "professional.documents_requested", entityType: "ProfessionalProfile", entityId: professionalId } });

    revalidatePath("/admin/professionals");
    await notifyProfessional(professionalId, "documents_required", "Documents needed", "BRIEVV needs additional documents to verify your account — upload them from your verification page.");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not request documents." };
  }
}
