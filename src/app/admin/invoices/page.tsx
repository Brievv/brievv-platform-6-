import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";
import { NotificationBell } from "@/components/features/notification-bell";

export default async function AdminInvoicesPage() {
  const invoices = await db.invoice.findMany({
    include: { organization: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Invoices</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 p-6 lg:p-8">
        {invoices.length === 0 ? (
          <p className="text-sm text-steel">
            No invoices yet. Invoice generation from completed milestones/payments is a background job not yet wired
            up (see docs/ROADMAP.md).
          </p>
        ) : (
          <div className="divide-y divide-ink/10 rounded-md border border-ink/10 bg-white">
            {invoices.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                <div>
                  <div className="text-ink">{inv.invoiceNumber}</div>
                  <div className="mono-label mt-0.5">{inv.organization?.name ?? "—"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-ink">{formatCents(inv.amountCents)}</span>
                  <Badge tone={inv.status === "PAID" ? "success" : inv.status === "OVERDUE" ? "danger" : "neutral"}>{inv.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
