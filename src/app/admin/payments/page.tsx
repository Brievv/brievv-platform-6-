import { db } from "@/lib/db";
import { PaymentsList, type PaymentRow } from "./payments-list";
import { NotificationBell } from "@/components/features/notification-bell";

export default async function AdminPaymentsPage() {
  const payments = await db.payment.findMany({
    include: { project: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const rows: PaymentRow[] = payments.map((p: any) => ({
    id: p.id,
    projectTitle: p.project.title,
    kind: p.kind,
    status: p.status,
    amountCents: p.amountCents,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Payments</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 p-6 lg:p-8">
        {rows.length === 0 ? <p className="text-sm text-steel">No payments yet.</p> : <PaymentsList initial={rows} />}
      </main>
    </>
  );
}
