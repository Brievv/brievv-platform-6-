"use server";

import { db } from "@/lib/db";

export interface TrackResult {
  found: boolean;
  referenceCode?: string;
  title?: string;
  status?: string;
  createdAt?: string;
}

/**
 * Public project lookup by reference code + the email that submitted it.
 * Since anonymous (pre-account) submissions are attributed to a system
 * placeholder user (see SYSTEM_ANONYMOUS_USER_ID in the estimate route),
 * this only resolves projects submitted by a signed-in account today —
 * matching an anonymous brief to an email is future work once brief
 * submissions capture a contact email directly on the Project record.
 */
export async function trackProject(referenceCode: string, email: string): Promise<TrackResult> {
  const code = referenceCode.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();
  if (!code || !normalizedEmail) return { found: false };

  const project = await db.project.findUnique({ where: { referenceCode: code } });
  if (!project) return { found: false };

  const owner = await db.user.findUnique({ where: { id: project.createdByUserId } });
  if (!owner || owner.email.toLowerCase() !== normalizedEmail) return { found: false };

  return {
    found: true,
    referenceCode: project.referenceCode,
    title: project.title,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
  };
}
