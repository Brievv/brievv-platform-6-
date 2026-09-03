import { db } from "@/lib/db";
import { NotificationBell } from "@/components/features/notification-bell";

export default async function AdminAuditLogsPage({ searchParams }: { searchParams: { entityType?: string; action?: string } }) {
  const where: any = {};
  if (searchParams.entityType) where.entityType = searchParams.entityType;
  if (searchParams.action) where.action = { contains: searchParams.action };

  const logs = await db.auditLog.findMany({
    where,
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const entityTypes = await db.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true } });

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Audit Logs</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 p-6 lg:p-8">
        <form className="mb-6 flex flex-wrap gap-3" method="get">
          <select name="entityType" defaultValue={searchParams.entityType ?? ""} className="h-10 rounded border border-ink/15 bg-white px-3 text-sm">
            <option value="">All entity types</option>
            {entityTypes.map((e: any) => (
              <option key={e.entityType} value={e.entityType}>
                {e.entityType}
              </option>
            ))}
          </select>
          <input
            name="action"
            defaultValue={searchParams.action ?? ""}
            placeholder="Search action..."
            className="h-10 rounded border border-ink/15 bg-white px-3 text-sm"
          />
          <button type="submit" className="h-10 rounded border border-ink/15 bg-white px-4 text-sm text-ink hover:border-orange/40">
            Filter
          </button>
        </form>

        {logs.length === 0 ? (
          <p className="text-sm text-steel">No audit log entries match.</p>
        ) : (
          <div className="divide-y divide-ink/10 rounded-md border border-ink/10 bg-white">
            {logs.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <span className="font-mono text-xs text-orange">{l.action}</span>
                  <span className="ml-2 text-steel">
                    {l.entityType} · {l.entityId.slice(0, 8)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-ink">{l.actor?.name ?? "System"}</div>
                  <div className="font-mono text-[0.7rem] text-steel/60">{l.createdAt.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
