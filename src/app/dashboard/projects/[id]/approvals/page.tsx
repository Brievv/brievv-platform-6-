import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { ProjectTabs } from "@/components/features/project-tabs";
import { ApprovalsList, type ApprovalData } from "./approvals-list";

const STAFF_ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER"];

export default async function ProjectApprovalsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const project = await db.project.findUnique({
    where: { id: params.id },
    include: { approvals: { orderBy: { createdAt: "desc" } } },
  });
  if (!project) notFound();
  if (project.createdByUserId !== userId && !STAFF_ROLES.includes(role)) notFound();

  // Only the client who owns the project decides approvals — staff can
  // request them but shouldn't be able to approve their own request.
  const canDecide = project.createdByUserId === userId;

  const approvals: ApprovalData[] = project.approvals.map((a: any) => ({
    id: a.id,
    subjectType: a.subjectType,
    title: a.title,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div>
      <DashboardTopbar title={project.title} />
      <ProjectTabs projectId={project.id} />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <ApprovalsList projectId={project.id} initial={approvals} canDecide={canDecide} />
      </div>
    </div>
  );
}
