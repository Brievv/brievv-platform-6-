import { db } from "@/lib/db";
import { AdminTasksList, type AdminTaskRow } from "./tasks-list";
import { NotificationBell } from "@/components/features/notification-bell";

export default async function AdminTasksPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status;

  const tasks = await db.projectTask.findMany({
    where: status ? { status: status as any } : undefined,
    include: { project: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const rows: AdminTaskRow[] = tasks.map((t: any) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    projectId: t.projectId,
    projectTitle: t.project.title,
    deadline: t.deadline ? t.deadline.toISOString() : null,
  }));

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Tasks</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 p-6 lg:p-8">
        {rows.length === 0 ? (
          <p className="text-sm text-steel">No tasks across any project yet.</p>
        ) : (
          <AdminTasksList initial={rows} />
        )}
      </main>
    </>
  );
}
