import { db } from "@/lib/db";
import { PricingRulesList, type PricingRuleRow } from "./pricing-rules-list";
import { NotificationBell } from "@/components/features/notification-bell";

export default async function AdminPricingRulesPage() {
  const rules = await db.pricingRule.findMany({ orderBy: { createdAt: "desc" } });
  const rows: PricingRuleRow[] = rules.map((r: any) => ({
    id: r.id,
    name: r.name,
    disciplineSlug: r.disciplineSlug,
    basePriceCents: r.basePriceCents,
    platformMarginPercent: r.platformMarginPercent,
    isActive: r.isActive,
  }));

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Pricing Rules</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 p-6 lg:p-8">
        <PricingRulesList initial={rows} />
      </main>
    </>
  );
}
