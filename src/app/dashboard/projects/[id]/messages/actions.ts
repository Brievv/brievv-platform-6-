"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { notify, notifyOps } from "@/server/services/notifications/notify";

const STAFF_ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER"];

async function assertProjectAccess(projectId: string, userId: string, role: string) {
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");
  if (project.createdByUserId !== userId && !STAFF_ROLES.includes(role)) throw new Error("Forbidden");
  return project;
}

/**
 * Gets (or lazily creates) the single client-facing thread for a project.
 * `isInternal: false` is what keeps this thread visible to the client —
 * ops/staff-only discussion belongs in a separate thread with
 * `isInternal: true`, which this function and the messages page never
 * query or create (spec §29, §72: "internal notes must never appear in
 * the client portal").
 */
async function getOrCreateClientThread(projectId: string) {
  let thread = await db.messageThread.findFirst({ where: { projectId, isInternal: false } });
  if (!thread) {
    thread = await db.messageThread.create({ data: { projectId, isInternal: false } });
  }
  return thread;
}

export async function sendProjectMessage(projectId: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  if (!body.trim()) return { ok: false, error: "Message can't be empty." };

  try {
    const project = await assertProjectAccess(projectId, userId, role);
    const thread = await getOrCreateClientThread(projectId);

    await db.message.create({
      data: { threadId: thread.id, senderId: userId, body: body.trim(), readByUserIds: [userId] },
    });

    // The client and staff share one thread, so "the other party" depends
    // on who's sending: a client message notifies ops; a staff reply
    // notifies the client who owns the project.
    if (userId === project.createdByUserId) {
      await notifyOps({
        type: "message_received",
        title: "New message from client",
        body: `${project.title}: ${body.trim().slice(0, 100)}`,
        link: `/admin/messages/${projectId}`,
      });
    } else {
      await notify({
        userId: project.createdByUserId,
        type: "message_received",
        title: "New message on your project",
        body: `${project.title}: ${body.trim().slice(0, 100)}`,
        link: `/dashboard/projects/${projectId}/messages`,
      });
    }

    revalidatePath(`/dashboard/projects/${projectId}/messages`);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not send message." };
  }
}
