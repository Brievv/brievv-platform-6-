"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const STAFF_ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER"];

async function assertProjectAccess(projectId: string, userId: string, role: string) {
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");
  if (project.createdByUserId !== userId && !STAFF_ROLES.includes(role)) throw new Error("Forbidden");
  return project;
}

export async function createTask(projectId: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Task title is required." };
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "MEDIUM");
  const deadlineRaw = String(formData.get("deadline") ?? "");
  const discipline = String(formData.get("discipline") ?? "").trim();

  try {
    await assertProjectAccess(projectId, userId, role);

    await db.projectTask.create({
      data: {
        projectId,
        title,
        description: description || null,
        priority: priority as any,
        discipline: discipline || null,
        deadline: deadlineRaw ? new Date(deadlineRaw) : null,
        status: "BACKLOG",
      },
    });

    revalidatePath(`/dashboard/projects/${projectId}/tasks`);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not create task." };
  }
}

const VALID_STATUSES = ["BACKLOG", "READY", "IN_PROGRESS", "REVIEW", "BLOCKED", "APPROVED", "COMPLETED"];

export async function updateTaskStatus(projectId: string, taskId: string, status: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  if (!VALID_STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

  try {
    await assertProjectAccess(projectId, userId, role);
    const task = await db.projectTask.findUnique({ where: { id: taskId } });
    if (!task || task.projectId !== projectId) return { ok: false, error: "Task not found." };

    await db.projectTask.update({ where: { id: taskId }, data: { status: status as any } });

    await db.auditLog.create({
      data: { actorId: userId, action: "task.status_changed", entityType: "ProjectTask", entityId: taskId, metadata: { status } },
    });

    revalidatePath(`/dashboard/projects/${projectId}/tasks`);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not update task." };
  }
}

export async function addTaskComment(projectId: string, taskId: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  if (!body.trim()) return { ok: false, error: "Comment can't be empty." };

  try {
    await assertProjectAccess(projectId, userId, role);
    const task = await db.projectTask.findUnique({ where: { id: taskId } });
    if (!task || task.projectId !== projectId) return { ok: false, error: "Task not found." };

    await db.taskComment.create({ data: { taskId, authorId: userId, body: body.trim() } });

    revalidatePath(`/dashboard/projects/${projectId}/tasks`);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not add comment." };
  }
}
