import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { ProjectTabs } from "@/components/features/project-tabs";
import { DeliverablesList, type DeliverableData } from "./deliverables-list";

const STAFF_ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER"];

export default async function ProjectDeliverablesPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      files: { where: { folder: "DELIVERABLES", isArchived: false }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) notFound();
  if (project.createdByUserId !== userId && !STAFF_ROLES.includes(role)) notFound();

  const files: DeliverableData[] = project.files.map((f: any) => ({
    id: f.id,
    fileName: f.fileName,
    sizeBytes: f.sizeBytes,
    scanStatus: f.scanStatus,
    createdAt: f.createdAt.toISOString(),
  }));

  return (
    <div>
      <DashboardTopbar title={project.title} />
      <ProjectTabs projectId={project.id} />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <DeliverablesList projectId={project.id} initialFiles={files} />
      </div>
    </div>
  );
}
