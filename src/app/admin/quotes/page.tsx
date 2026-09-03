import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";
import { NotificationBell } from "@/components/features/notification-bell";

const STATUS_TONE: Record<string, "neutral" | "info" | "success" | "warning" | "danger"> = {
  DRAFT: "neutral",
  GENERATING: "neutral",
  PENDING_REVIEW: "warning",
  READY: "info",
  SENT: "info",
  VIEWED: "info",
  ACCEPTED: "success",
  DECLINED: "neutral",
  EXPIRED: "neutral",
  REVISED: "warning",
  CANCELLED: "neutral",
};

export default async function AdminQuotesPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status;
  const quotes = await db.quote.findMany({
    where: status ? { status: status as any } : undefined,
    include: { project: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Quotes</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 p-6 lg:p-8">
        {quotes.length === 0 ? (
          <p className="text-sm text-steel">No quotes match.</p>
        ) : (
          <div className="divide-y divide-ink/10 rounded-md border border-ink/10 bg-white">
            {quotes.map((q: any) => (
              <Link
                key={q.id}
                href={`/dashboard/quotes/${q.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm hover:bg-ink/[0.02]"
              >
                <div>
                  <div className="mono-label">{q.quoteNumber}</div>
                  <div className="mt-0.5 font-medium text-ink">{q.project.title}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-steel">
                    {formatCents(q.priceLowCents)}
                  </span>
                  <Badge tone={STATUS_TONE[q.status] ?? "neutral"}>{q.status.replace(/_/g, " ")}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
