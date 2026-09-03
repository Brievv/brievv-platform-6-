import { db } from "@/lib/db";
import { SupportTicketsList, type TicketRow } from "./support-list";
import { NotificationBell } from "@/components/features/notification-bell";

export default async function AdminSupportPage() {
  const tickets = await db.supportTicket.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const rows: TicketRow[] = tickets.map((t: any) => ({
    id: t.id,
    category: t.category,
    subject: t.subject,
    message: t.message,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Support</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 p-6 lg:p-8">
        {rows.length === 0 ? <p className="text-sm text-steel">No support tickets yet.</p> : <SupportTicketsList initial={rows} />}
      </main>
    </>
  );
}
