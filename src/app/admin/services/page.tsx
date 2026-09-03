import { db } from "@/lib/db";
import { ServicesList, type DisciplineRow } from "./services-list";
import { NotificationBell } from "@/components/features/notification-bell";

export default async function AdminServicesPage() {
  const disciplines = await db.discipline.findMany({
    include: { _count: { select: { services: true } } },
    orderBy: { sortOrder: "asc" },
  });

  const rows: DisciplineRow[] = disciplines.map((d: any) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    isActive: d.isActive,
    serviceCount: d._count.services,
  }));

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Services &amp; Disciplines</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 p-6 lg:p-8">
        <ServicesList initial={rows} />
      </main>
    </>
  );
}
