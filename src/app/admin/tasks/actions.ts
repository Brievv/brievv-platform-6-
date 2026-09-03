"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";

export async function updateTaskStatusAdmin(taskId: string, status: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const actorId = (session.user as any).id as string;
  const role = (session.user as any).role;

  try {
    assertCan(role, "project.status.update");
  } catch {
    return { ok: false, error: "You don't have permission to update tasks." };
  }

  await db.projectTask.update({ where: { id: taskId }, data: { status: status as any } });
  await db.auditLog.create({ data: { actorId, action: "task.status_changed", entityType: "ProjectTask", entityId: taskId, metadata: { status } } });

  revalidatePath("/admin/tasks");
  return { ok: true };
}
