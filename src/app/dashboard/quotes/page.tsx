import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";

const STATUS_TONE: Record<string, "neutral" | "info" | "success" | "warning" | "danger" | "dark"> = {
  PENDING_REVIEW: "warning",
  READY: "info",
  SENT: "info",
  ACCEPTED: "success",
  DECLINED: "neutral",
  EXPIRED: "neutral",
};

export default async function QuotesListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;

  const quotes = await db.quote.findMany({
    where: { project: { createdByUserId: userId } },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <DashboardTopbar title="Quotes" />
      <div className="mx-auto max-w-4xl px-6 py-10">
        {quotes.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <p className="text-sm text-steel">No quotes yet — submit a brief to get one.</p>
              <Link href="/start" className="mt-3 inline-block text-sm font-medium text-orange hover:underline">
                Start a project →
              </Link>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {quotes.map((q: (typeof quotes)[number]) => (
              <Link key={q.id} href={`/dashboard/quotes/${q.id}`}>
                <Card className="transition-colors hover:border-orange/40">
                  <CardBody className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="mono-label">{q.quoteNumber}</div>
                      <div className="mt-1 font-medium text-ink">{q.project.title}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm text-ink">
                        {formatCents(q.priceLowCents)}–{formatCents(q.priceHighCents)}
                      </div>
                      <Badge tone={STATUS_TONE[q.status] ?? "neutral"} className="mt-1.5">
                        {q.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
