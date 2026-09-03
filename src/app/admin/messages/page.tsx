import Link from "next/link";
import { db } from "@/lib/db";
import { NotificationBell } from "@/components/features/notification-bell";

export default async function AdminMessagesPage() {
  const threads = await db.messageThread.findMany({
    include: { project: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  // Collapse to one row per project (a project can have both a client
  // thread and an internal thread — this list is just a directory into
  // the per-project detail view, which shows both).
  const byProject = new Map<string, { projectId: string; title: string; latest?: string }>();
  for (const t of threads as any[]) {
    const existing = byProject.get(t.projectId);
    const latest = t.messages[0]?.body;
    if (!existing || (latest && !existing.latest)) {
      byProject.set(t.projectId, { projectId: t.projectId, title: t.project.title, latest });
    }
  }

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Messages</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 p-6 lg:p-8">
        {byProject.size === 0 ? (
          <p className="text-sm text-steel">No message threads yet.</p>
        ) : (
          <div className="divide-y divide-ink/10 rounded-md border border-ink/10 bg-white">
            {Array.from(byProject.values()).map((p) => (
              <Link key={p.projectId} href={`/admin/messages/${p.projectId}`} className="flex items-center justify-between px-5 py-3.5 text-sm hover:bg-ink/[0.02]">
                <span className="font-medium text-ink">{p.title}</span>
                {p.latest && <span className="max-w-xs truncate text-steel">{p.latest}</span>}
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
