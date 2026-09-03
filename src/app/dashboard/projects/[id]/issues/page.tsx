import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { ProjectTabs } from "@/components/features/project-tabs";
import { IssuesList, type IssueData } from "./issues-list";

const STAFF_ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER"];

export default async function ProjectIssuesPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const project = await db.project.findUnique({
    where: { id: params.id },
    include: { issues: { orderBy: { createdAt: "desc" } } },
  });
  if (!project) notFound();
  if (project.createdByUserId !== userId && !STAFF_ROLES.includes(role)) notFound();

  const issues: IssueData[] = project.issues.map((i: any) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    severity: i.severity,
    status: i.status,
    createdAt: i.createdAt.toISOString(),
  }));

  return (
    <div>
      <DashboardTopbar title={project.title} />
      <ProjectTabs projectId={project.id} />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <IssuesList projectId={project.id} initial={issues} />
      </div>
    </div>
  );
}
