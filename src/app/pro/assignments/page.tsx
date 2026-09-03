import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { AssignmentsList, type AssignmentData } from "./assignments-list";

export default async function ProAssignmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;

  const profile = await db.professionalProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/pro");

  const assignments = await db.assignment.findMany({
    where: { professionalId: profile.id },
    include: { project: true },
    orderBy: { proposedAt: "desc" },
  });

  const data: AssignmentData[] = assignments.map((a: any) => ({
    id: a.id,
    projectTitle: a.project.title,
    roleOnProject: a.roleOnProject,
    status: a.status,
    matchScore: a.matchScore,
  }));

  return (
    <div>
      <DashboardTopbar title="Assignments" />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <AssignmentsList initial={data} />
      </div>
    </div>
  );
}
