import { db } from "@/lib/db";
import { formatCents } from "@/lib/utils";
import { NotificationBell } from "@/components/features/notification-bell";

/**
 * Every number here is computed directly from the database at request
 * time. Metrics the app has no real data source for yet — visitor counts,
 * signup conversion funnels — are simply omitted rather than shown with
 * placeholder numbers (spec §35: "Do not fabricate data"). Wiring up
 * visitor analytics means adding a pageview event pipeline, which isn't
 * built yet; see docs/ROADMAP.md.
 */
export default async function AdminAnalyticsPage() {
  const [
    totalProjects,
    totalQuotes,
    acceptedQuotes,
    completedProjects,
    payments,
    professionalCount,
    activeProfessionalCount,
  ] = await Promise.all([
    db.project.count(),
    db.quote.count(),
    db.quote.count({ where: { status: "ACCEPTED" } }),
    db.project.count({ where: { status: "COMPLETED" } }),
    db.payment.findMany({ where: { status: "PAID" } }),
    db.professionalProfile.count(),
    db.professionalProfile.count({ where: { status: "ACTIVE" } }),
  ]);

  const grossRevenueCents = payments.reduce((sum: number, p: any) => sum + p.amountCents, 0);
  const platformFeeCents = payments.reduce((sum: number, p: any) => sum + (p.platformFeeCents ?? 0), 0);
  const quoteConversionPct = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;

  const quotesWithAmounts = await db.quote.findMany({ where: { status: "ACCEPTED" }, select: { priceLowCents: true, priceHighCents: true } });
  const avgProjectValueCents =
    quotesWithAmounts.length > 0
      ? Math.round(quotesWithAmounts.reduce((sum: number, q: any) => sum + (q.priceLowCents + q.priceHighCents) / 2, 0) / quotesWithAmounts.length)
      : 0;

  const boxes = [
    { label: "Total briefs submitted", value: String(totalProjects) },
    { label: "Quotes generated", value: String(totalQuotes) },
    { label: "Quote acceptance rate", value: `${quoteConversionPct}%` },
    { label: "Projects completed", value: String(completedProjects) },
    { label: "Gross revenue (paid)", value: formatCents(grossRevenueCents) },
    { label: "Platform revenue (fees)", value: formatCents(platformFeeCents) },
    { label: "Avg. accepted quote value", value: formatCents(avgProjectValueCents) },
    { label: "Professionals (active / total)", value: `${activeProfessionalCount} / ${professionalCount}` },
  ];

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Analytics</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {boxes.map((b) => (
            <div key={b.label} className="rounded-md border border-ink/10 bg-white p-5">
              <div className="font-display text-2xl font-medium text-ink">{b.value}</div>
              <div className="mono-label mt-1">{b.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-xl text-xs text-steel">
          Visitor counts, signup conversion, and traffic-source metrics require a pageview/event pipeline that isn't
          wired up in this build — they're intentionally left out rather than shown as placeholder numbers.
        </p>
      </main>
    </>
  );
}
