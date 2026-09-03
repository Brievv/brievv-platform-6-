import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/features/notification-bell";

export default async function AdminProjectsPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status;

  const projects = await db.project.findMany({
    where: status ? { status: status as any } : undefined,
    include: { disciplines: { include: { discipline: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">
          Projects {status && <span className="text-steel">· {status.replace(/_/g, " ")}</span>}
        </h1>
        <div className="flex items-center gap-4">
          {status && (
            <Link href="/admin/projects" className="text-sm text-orange hover:underline">
              Clear filter
            </Link>
          )}
          <NotificationBell />
        </div>
      </header>
      <main className="flex-1 space-y-2.5 p-6 lg:p-8">
        {projects.length === 0 ? (
          <p className="text-sm text-steel">No projects match.</p>
        ) : (
          projects.map((p: any) => (
            <Link
              key={p.id}
              href={`/dashboard/projects/${p.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-ink/10 bg-white p-4 transition-colors hover:border-orange/40"
            >
              <div>
                <div className="mono-label">{p.referenceCode}</div>
                <div className="mt-1 font-medium text-ink">{p.title}</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {p.disciplines.map((d: any) => (
                    <Badge key={d.disciplineId}>{d.discipline.name}</Badge>
                  ))}
                </div>
              </div>
              <Badge tone="dark">{p.status.replace(/_/g, " ")}</Badge>
            </Link>
          ))
        )}
      </main>
    </>
  );
}
