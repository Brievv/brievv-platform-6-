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

export async function raiseIssue(projectId: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Title is required." };
  const description = String(formData.get("description") ?? "").trim();
  const severity = String(formData.get("severity") ?? "MEDIUM");

  try {
    const project = await assertProjectAccess(projectId, userId, role);

    await db.projectIssue.create({
      data: { projectId, raisedById: userId, title, description, severity },
    });

    if (userId === project.createdByUserId) {
      await notifyOps({ type: "issue_raised", title: "New issue raised", body: `${project.title}: ${title}`, link: `/dashboard/projects/${projectId}/issues` });
    } else {
      await notify({ userId: project.createdByUserId, type: "issue_raised", title: "New issue on your project", body: `${project.title}: ${title}`, link: `/dashboard/projects/${projectId}/issues` });
    }

    revalidatePath(`/dashboard/projects/${projectId}/issues`);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not raise issue." };
  }
}

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "WONT_FIX"];

export async function updateIssueStatus(projectId: string, issueId: string, status: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  if (!VALID_STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

  try {
    await assertProjectAccess(projectId, userId, role);
    const issue = await db.projectIssue.findUnique({ where: { id: issueId } });
    if (!issue || issue.projectId !== projectId) return { ok: false, error: "Issue not found." };

    await db.projectIssue.update({
      where: { id: issueId },
      data: { status, resolvedAt: status === "RESOLVED" ? new Date() : null },
    });

    await db.auditLog.create({ data: { actorId: userId, action: "issue.status_changed", entityType: "ProjectIssue", entityId: issueId, metadata: { status } } });

    revalidatePath(`/dashboard/projects/${projectId}/issues`);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not update issue." };
  }
}
