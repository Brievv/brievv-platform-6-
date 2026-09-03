import { db } from "@/lib/db";
import { MatchingConsole, type ProjectOption } from "./matching-console";
import { NotificationBell } from "@/components/features/notification-bell";

export default async function AdminMatchingPage() {
  const projects = await db.project.findMany({
    where: { status: { in: ["QUOTE_ACCEPTED", "PAYMENT_PENDING", "READY_TO_START", "MATCHING"] } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const options: ProjectOption[] = projects.map((p: any) => ({ id: p.id, label: `${p.referenceCode} — ${p.title}` }));

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Matching</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 p-6 lg:p-8">
        {options.length === 0 ? (
          <p className="text-sm text-steel">No projects are currently ready for matching.</p>
        ) : (
          <MatchingConsole projects={options} />
        )}
      </main>
    </>
  );
}
