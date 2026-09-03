import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/features/notification-bell";

export default async function AdminClientsPage() {
  const clients = await db.user.findMany({
    where: { role: "CLIENT" },
    include: { clientProfile: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const projectCounts = await db.project.groupBy({
    by: ["createdByUserId"],
    _count: { id: true },
  });
  const countByUser = new Map<string, number>(projectCounts.map((p: any) => [p.createdByUserId, p._count.id]));

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Clients</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 p-6 lg:p-8">
        {clients.length === 0 ? (
          <p className="text-sm text-steel">No clients yet.</p>
        ) : (
          <div className="divide-y divide-ink/10 rounded-md border border-ink/10 bg-white">
            {clients.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                <div>
                  <div className="font-medium text-ink">{c.name}</div>
                  <div className="mono-label mt-0.5">{c.email}</div>
                  {c.clientProfile?.companyName && <div className="mt-0.5 text-xs text-steel">{c.clientProfile.companyName}</div>}
                </div>
                <Badge>{countByUser.get(c.id) ?? 0} project{(countByUser.get(c.id) ?? 0) === 1 ? "" : "s"}</Badge>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
