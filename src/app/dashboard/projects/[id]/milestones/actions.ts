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

export async function createMilestone(projectId: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Title is required." };
  const description = String(formData.get("description") ?? "").trim();
  const dueDateRaw = String(formData.get("dueDate") ?? "");
  const amountRaw = String(formData.get("amount") ?? "");
  const amountCents = amountRaw ? Math.round(parseFloat(amountRaw) * 100) : null;

  try {
    await assertProjectAccess(projectId, userId, role);
    const count = await db.projectMilestone.count({ where: { projectId } });

    await db.projectMilestone.create({
      data: {
        projectId,
        title,
        description: description || null,
        dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
        amountCents,
        sortOrder: count,
      },
    });

    revalidatePath(`/dashboard/projects/${projectId}/milestones`);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not create milestone." };
  }
}

export async function toggleMilestoneComplete(projectId: string, milestoneId: string, complete: boolean): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  try {
    await assertProjectAccess(projectId, userId, role);
    const milestone = await db.projectMilestone.findUnique({ where: { id: milestoneId } });
    if (!milestone || milestone.projectId !== projectId) return { ok: false, error: "Milestone not found." };

    await db.projectMilestone.update({
      where: { id: milestoneId },
      data: { completedAt: complete ? new Date() : null },
    });

    await db.auditLog.create({
      data: {
        actorId: userId,
        action: complete ? "milestone.completed" : "milestone.reopened",
        entityType: "ProjectMilestone",
        entityId: milestoneId,
      },
    });

    revalidatePath(`/dashboard/projects/${projectId}/milestones`);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not update milestone." };
  }
}
