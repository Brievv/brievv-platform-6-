"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { rankProfessionals, type MatchResult } from "@/server/services/matching/matching-engine";
import { notify } from "@/server/services/notifications/notify";

async function requireMatchingPermission() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Sign in required.");
  const role = (session.user as any).role;
  assertCan(role, "matching.run");
  return session;
}

export async function runMatchingForProject(projectId: string): Promise<{ ok: true; results: MatchResult[] } | { ok: false; error: string }> {
  try {
    await requireMatchingPermission();

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { disciplines: { include: { discipline: true } } },
    });
    if (!project) return { ok: false, error: "Project not found." };

    const disciplineNames = project.disciplines.map((d: any) => d.discipline.name);

    const candidates = await db.professionalProfile.findMany({
      where: { status: { in: ["VERIFIED", "ACTIVE"] }, disciplines: { some: { discipline: { name: { in: disciplineNames } } } } },
      include: { user: true, disciplines: { include: { discipline: true } }, availability: true },
    });

    const results = rankProfessionals(
      {
        disciplines: disciplineNames,
        jurisdiction: project.jurisdiction,
        budgetHighCents: project.budgetHigh,
        deadline: project.deadline,
      },
      candidates.map((c: any) => ({
        id: c.id,
        name: c.user.name,
        status: c.status,
        disciplines: c.disciplines.map((d: any) => d.discipline.name),
        yearsExperience: c.yearsExperience,
        jurisdictions: c.jurisdictions,
        hourlyRateCents: c.hourlyRateCents,
        qualityScore: c.qualityScore,
        completedProjects: c.completedProjects,
        licenseNumber: c.licenseNumber,
        hasOpenAvailability: c.availability.length === 0 || c.availability.some((a: any) => !a.endDate || a.endDate > new Date()),
      }))
    );

    return { ok: true, results };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Matching failed." };
  }
}

export async function proposeAssignment(projectId: string, professionalId: string, matchScore: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireMatchingPermission();
    const actorId = (session.user as any).id as string;

    const project = await db.project.findUnique({ where: { id: projectId }, include: { disciplines: { include: { discipline: true } } } });
    if (!project) return { ok: false, error: "Project not found." };

    const roleOnProject = project.disciplines[0]?.discipline.name ?? "Team member";

    await db.$transaction([
      db.assignment.create({
        data: { projectId, professionalId, roleOnProject, matchScore, status: "PROPOSED" },
      }),
      db.project.update({
        where: { id: projectId },
        data: { status: "MATCHING", statusHistory: { create: { status: "MATCHING", actorId } } },
      }),
      db.auditLog.create({
        data: { actorId, action: "assignment.proposed", entityType: "Project", entityId: projectId, metadata: { professionalId, matchScore } },
      }),
    ]);

    revalidatePath("/admin/matching");

    const professional = await db.professionalProfile.findUnique({ where: { id: professionalId } });
    if (professional) {
      await notify({
        userId: professional.userId,
        type: "assignment_proposed",
        title: "New project proposal",
        body: `${project.title} — ${roleOnProject}. Review and respond in your assignments.`,
        link: "/pro/assignments",
      });
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not propose assignment." };
  }
}
