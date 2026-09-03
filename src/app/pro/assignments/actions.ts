"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyOps } from "@/server/services/notifications/notify";

export async function respondToAssignment(assignmentId: string, accept: boolean): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;

  const profile = await db.professionalProfile.findUnique({ where: { userId } });
  if (!profile) return { ok: false, error: "No professional profile found." };

  const assignment = await db.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment || assignment.professionalId !== profile.id) return { ok: false, error: "Assignment not found." };
  if (assignment.status !== "PROPOSED") return { ok: false, error: "This assignment has already been responded to." };

  await db.$transaction([
    db.assignment.update({
      where: { id: assignmentId },
      data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
    }),
    db.auditLog.create({
      data: {
        actorId: userId,
        action: accept ? "assignment.accepted" : "assignment.declined",
        entityType: "Assignment",
        entityId: assignmentId,
      },
    }),
    ...(accept
      ? [
          db.project.update({
            where: { id: assignment.projectId },
            data: { status: "TEAM_ASSIGNED", statusHistory: { create: { status: "TEAM_ASSIGNED" } } },
          }),
        ]
      : []),
  ]);

  revalidatePath("/pro/assignments");

  const project = await db.project.findUnique({ where: { id: assignment.projectId } });
  await notifyOps({
    type: accept ? "assignment_accepted" : "assignment_declined",
    title: accept ? "Professional accepted assignment" : "Professional declined assignment",
    body: `${session.user.name ?? "A professional"} ${accept ? "accepted" : "declined"} ${project?.title ?? "a project"}.`,
    link: project ? `/dashboard/projects/${project.id}` : "/admin/matching",
  });

  return { ok: true };
}
