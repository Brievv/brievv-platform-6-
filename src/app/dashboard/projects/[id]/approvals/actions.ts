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

/** Staff request client sign-off on a milestone or deliverable. */
export async function requestApproval(
  projectId: string,
  subjectType: "MILESTONE" | "DELIVERABLE" | "CHANGE_ORDER",
  subjectId: string,
  title: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  try {
    const project = await assertProjectAccess(projectId, userId, role);

    await db.approval.create({ data: { projectId, requestedById: userId, subjectType, subjectId, title } });
    await notify({
      userId: project.createdByUserId,
      type: "approval_requested",
      title: "Approval needed",
      body: `${project.title}: ${title}`,
      link: `/dashboard/projects/${projectId}/approvals`,
    });

    revalidatePath(`/dashboard/projects/${projectId}/approvals`);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not request approval." };
  }
}

export async function decideApproval(projectId: string, approvalId: string, approve: boolean): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  try {
    const project = await assertProjectAccess(projectId, userId, role);
    const approval = await db.approval.findUnique({ where: { id: approvalId } });
    if (!approval || approval.projectId !== projectId) return { ok: false, error: "Approval not found." };
    if (approval.status !== "PENDING") return { ok: false, error: "This approval has already been decided." };

    await db.approval.update({
      where: { id: approvalId },
      data: { status: approve ? "APPROVED" : "REJECTED", decidedById: userId, decidedAt: new Date() },
    });

    await db.auditLog.create({
      data: { actorId: userId, action: approve ? "approval.approved" : "approval.rejected", entityType: "Approval", entityId: approvalId },
    });

    await notifyOps({
      type: approve ? "approval_approved" : "approval_rejected",
      title: approve ? "Client approved" : "Client rejected",
      body: `${project.title}: ${approval.title}`,
      link: `/dashboard/projects/${projectId}/approvals`,
    });

    revalidatePath(`/dashboard/projects/${projectId}/approvals`);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not record decision." };
  }
}
