"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Attaches uploaded verification documents to the professional's
 * verification record and moves their status to VERIFICATION_PENDING —
 * an admin must still approve (spec §21). Documents are private:
 * `documentsStorageKeys` is never queried by any client-facing page,
 * only by the admin verification review UI.
 */
export async function submitVerificationDocuments(storageKeys: string[]): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;

  if (storageKeys.length === 0) return { ok: false, error: "Upload at least one document." };

  const profile = await db.professionalProfile.findUnique({ where: { userId } });
  if (!profile) return { ok: false, error: "No professional profile found." };

  await db.$transaction([
    db.professionalVerification.upsert({
      where: { professionalId: profile.id },
      update: { documentsStorageKeys: { push: storageKeys }, status: "VERIFICATION_PENDING" },
      create: { professionalId: profile.id, documentsStorageKeys: storageKeys, status: "VERIFICATION_PENDING" },
    }),
    db.professionalProfile.update({ where: { id: profile.id }, data: { status: "VERIFICATION_PENDING" } }),
    db.auditLog.create({
      data: { actorId: userId, action: "professional.documents_submitted", entityType: "ProfessionalProfile", entityId: profile.id },
    }),
  ]);

  revalidatePath("/pro/verification");
  revalidatePath("/pro");
  return { ok: true };
}
