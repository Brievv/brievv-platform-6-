import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { ProjectTabs } from "@/components/features/project-tabs";
import { TaskBoard, type TaskData } from "./task-board";

const STAFF_ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER"];

export default async function ProjectTasksPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      tasks: {
        orderBy: { createdAt: "asc" },
        include: { comments: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
  if (!project) notFound();
  if (project.createdByUserId !== userId && !STAFF_ROLES.includes(role)) notFound();

  // Comment author names require a lookup since TaskComment only stores authorId
  const authorIds = Array.from(new Set(project.tasks.flatMap((t: any) => t.comments.map((c: any) => c.authorId))));
  const authors = authorIds.length ? await db.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } }) : [];
  const authorNameById = new Map<string, string>(authors.map((a: any) => [a.id, a.name]));

  const tasks: TaskData[] = project.tasks.map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: t.status,
    discipline: t.discipline,
    deadline: t.deadline ? t.deadline.toISOString() : null,
    comments: t.comments.map((c: any) => ({
      id: c.id,
      body: c.body,
      authorName: authorNameById.get(c.authorId) ?? "Unknown",
      createdAt: c.createdAt.toISOString(),
    })),
  }));

  return (
    <div>
      <DashboardTopbar title={project.title} />
      <ProjectTabs projectId={project.id} />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <TaskBoard projectId={project.id} initialTasks={tasks} />
      </div>
    </div>
  );
}
