import { db } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { formatCents } from "@/lib/utils";
import Link from "next/link";
import { NotificationBell } from "@/components/features/notification-bell";
import type { ProjectStatus } from "@prisma/client";

/**
 * Live Operations command center. Every metric here is a real query
 * against Project/Quote/Payment — clicking a metric deep-links to
 * /admin/projects pre-filtered by that status (spec §60).
 */
export default async function AdminDashboardPage() {
  const statusBuckets: Array<{ label: string; statuses: ProjectStatus[] }> = [
    { label: "Analyzing", statuses: ["ANALYZING"] },
    { label: "Awaiting quote review", statuses: ["QUOTE_READY"] },
    { label: "Awaiting payment", statuses: ["PAYMENT_PENDING", "QUOTE_ACCEPTED"] },
    { label: "Matching", statuses: ["MATCHING", "READY_TO_START"] },
    { label: "In progress", statuses: ["IN_PROGRESS", "TEAM_ASSIGNED"] },
    { label: "Internal QA", statuses: ["INTERNAL_REVIEW", "FINAL_QA"] },
    { label: "Client review", statuses: ["CLIENT_REVIEW", "REVISION"] },
  ];

  const [counts, revenueAgg, newBriefsToday, avgQuote] = await Promise.all([
    Promise.all(
      statusBuckets.map((b) =>
        db.project.count({
          where: { status: { in: b.statuses as ProjectStatus[] } },
        })
      )
    ),
    db.payment.aggregate({ where: { status: "PAID" }, _sum: { amountCents: true } }),
    db.project.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    db.quote.aggregate({ _avg: { priceLowCents: true, priceHighCents: true } }),
  ]).catch(() => [statusBuckets.map(() => 0), { _sum: { amountCents: 0 } }, 0, { _avg: { priceLowCents: 0, priceHighCents: 0 } }] as const);

  const overdue = await db.project
    .count({ where: { deadline: { lt: new Date() }, status: { notIn: ["DELIVERED", "COMPLETED", "CANCELLED", "ARCHIVED"] } } })
    .catch(() => 0);

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <div>
          <h1 className="font-display text-lg font-medium text-ink">Live Operations</h1>
        </div>
        <span className="flex items-center gap-4">
          <span className="mono-label flex items-center gap-1.5 text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> SYSTEM OPERATIONAL
          </span>
          <NotificationBell />
        </span>
      </header>

      <main className="flex-1 space-y-8 p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardBody>
              <div className="font-display text-2xl font-medium text-ink">{formatCents(revenueAgg._sum.amountCents ?? 0)}</div>
              <div className="mono-label mt-1">Gross revenue</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="font-display text-2xl font-medium text-ink">{newBriefsToday}</div>
              <div className="mono-label mt-1">New briefs today</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="font-display text-2xl font-medium text-ink">
                {formatCents(((avgQuote._avg.priceLowCents ?? 0) + (avgQuote._avg.priceHighCents ?? 0)) / 2)}
              </div>
              <div className="mono-label mt-1">Avg project value</div>
            </CardBody>
          </Card>
          <Card className={overdue > 0 ? "border-danger/40" : ""}>
            <CardBody>
              <div className="font-display text-2xl font-medium text-ink">{overdue}</div>
              <div className="mono-label mt-1">Overdue projects</div>
            </CardBody>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 font-display text-base font-medium text-ink">Projects by stage</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            {statusBuckets.map((b, i) => (
              <Link
                key={b.label}
                href={`/admin/projects?status=${b.statuses[0]}`}
                className="rounded-md border border-ink/10 bg-white p-4 transition-colors hover:border-orange/40"
              >
                <div className="font-display text-xl font-medium text-ink">{counts[i]}</div>
                <div className="mono-label mt-1 leading-snug">{b.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
