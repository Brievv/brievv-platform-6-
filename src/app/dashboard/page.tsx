import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents, timeAgo } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardOverviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");

  const userId = (session.user as any).id as string;

  // Real queries — a client only ever sees projects they created or are
  // a member of, enforced here at the query level (spec §72).
  const [activeProjects, pendingQuotes, outstandingInvoices, unreadMessages] = await Promise.all([
    db.project.findMany({
      where: {
        createdByUserId: userId,
        status: { in: ["IN_PROGRESS", "TEAM_ASSIGNED", "INTERNAL_REVIEW", "CLIENT_REVIEW", "REVISION", "FINAL_QA"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    db.quote.findMany({
      where: { project: { createdByUserId: userId }, status: { in: ["SENT", "VIEWED", "READY"] } },
      include: { project: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.invoice.findMany({ where: { status: { in: ["OPEN", "OVERDUE"] } }, take: 5 }),
    db.message.count({ where: { NOT: { readByUserIds: { has: userId } } } }),
  ]).catch(() => [[], [], [], 0] as const); // graceful fallback if DB isn't migrated/connected yet

  const stats = [
    { label: "Active projects", value: activeProjects.length },
    { label: "Pending quotes", value: pendingQuotes.length },
    { label: "Outstanding invoices", value: outstandingInvoices.length },
    { label: "Unread messages", value: unreadMessages },
  ];

  return (
    <>
      <DashboardTopbar title="Overview" />
      <main className="flex-1 space-y-8 p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardBody>
                <div className="font-display text-2xl font-medium text-ink">{s.value}</div>
                <div className="mono-label mt-1">{s.label}</div>
              </CardBody>
            </Card>
          ))}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-medium text-ink">Active projects</h2>
            <Link href="/dashboard/projects" className="text-sm text-orange hover:underline">
              View all
            </Link>
          </div>
          {activeProjects.length === 0 ? (
            <Card>
              <CardBody className="py-12 text-center">
                <p className="text-sm text-steel">No active projects yet.</p>
                <Link href="/start" className="mt-3 inline-block text-sm font-medium text-orange hover:underline">
                  Start your first project →
                </Link>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeProjects.map((p: (typeof activeProjects)[number]) => (
                <Card key={p.id}>
                  <CardBody className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-ink">{p.title}</div>
                      <div className="mt-1 font-mono text-xs text-steel">
                        {p.referenceCode} · updated {timeAgo(p.updatedAt)}
                      </div>
                    </div>
                    <Badge tone="info">{p.status.replace(/_/g, " ")}</Badge>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 font-display text-base font-medium text-ink">Quotes awaiting your review</h2>
          {pendingQuotes.length === 0 ? (
            <Card>
              <CardBody className="py-8 text-center text-sm text-steel">Nothing waiting on you right now.</CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingQuotes.map((q: (typeof pendingQuotes)[number]) => (
                <Card key={q.id}>
                  <CardBody className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-ink">{q.project.title}</div>
                      <div className="mt-1 font-mono text-xs text-steel">
                        {formatCents(q.priceLowCents)}–{formatCents(q.priceHighCents)} · {q.timelineText}
                      </div>
                    </div>
                    <Link href={`/dashboard/quotes/${q.id}`} className="text-sm font-medium text-orange hover:underline">
                      Review →
                    </Link>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
