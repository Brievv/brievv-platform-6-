"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";

async function requireStaff() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Sign in required.");
  const role = (session.user as any).role;
  assertCan(role, "project.view.all"); // staff-wide visibility permission, held by every internal role
  return session;
}

/**
 * `internal: true` writes to (and lazily creates) a SEPARATE thread with
 * `isInternal: true` — never the client-facing one. This is the other
 * half of the isolation described in docs/ARCHITECTURE.md §9: the client
 * page only ever queries `isInternal: false`, and this action only ever
 * writes `isInternal: true` notes to a distinct thread, so the two can
 * never collide even if a bug reordered these calls.
 */
export async function sendAdminMessage(projectId: string, body: string, internal: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireStaff();
    const userId = (session.user as any).id as string;
    if (!body.trim()) return { ok: false, error: "Message can't be empty." };

    let thread = await db.messageThread.findFirst({ where: { projectId, isInternal: internal } });
    if (!thread) thread = await db.messageThread.create({ data: { projectId, isInternal: internal } });

    await db.message.create({ data: { threadId: thread.id, senderId: userId, body: body.trim(), readByUserIds: [userId] } });

    revalidatePath(`/admin/messages/${projectId}`);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not send message." };
  }
}
