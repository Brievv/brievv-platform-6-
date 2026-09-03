import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";
import { QuoteActions } from "./quote-actions";

const STATUS_TONE: Record<string, "neutral" | "info" | "success" | "warning" | "danger" | "dark"> = {
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

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;

  const quote = await db.quote.findUnique({
    where: { id: params.id },
    include: { project: { include: { disciplines: { include: { discipline: true } } } } },
  });

  // A client can only ever see their own quotes — the query above doesn't
  // filter by owner so we can distinguish "not found" from "not yours"
  // for the 404 page, but the check below is what actually enforces it.
  if (!quote) notFound();
  const role = (session.user as any).role as string;
  const isStaff = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER"].includes(role);
  if (quote.project.createdByUserId !== userId && !isStaff) notFound();

  const milestones = Array.isArray(quote.milestones) ? (quote.milestones as any[]) : [];

  return (
    <div>
      <DashboardTopbar title={`Quote · ${quote.quoteNumber}`} />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Card>
          <CardBody className="space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-6">
              <div>
                <div className="mono-label">BRIEVV project · {quote.project.referenceCode}</div>
                <h1 className="mt-1 font-display text-2xl font-medium text-ink">{quote.project.title}</h1>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {quote.project.disciplines.map((d: (typeof quote.project.disciplines)[number]) => (
                    <Badge key={d.disciplineId} tone="neutral">
                      {d.discipline.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <Badge tone={STATUS_TONE[quote.status] ?? "neutral"}>{quote.status.replace(/_/g, " ")}</Badge>
            </div>

            <div className="grid grid-cols-1 divide-y divide-ink/10 rounded-md border border-ink/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <Stat label="Exact project price" value={formatCents(quote.priceLowCents)} />
              <Stat label="Timeline" value={quote.timelineText} />
              <Stat label="Expires" value={quote.expiresAt ? new Date(quote.expiresAt).toLocaleDateString() : "—"} />
            </div>

            <Section title="Recommended team">
              <div className="flex flex-wrap gap-1.5">
                {quote.recommendedTeam.map((t: string) => (
                  <Badge key={t} tone="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            </Section>

            <Section title="Scope summary">
              <p className="text-sm leading-relaxed text-ink">{quote.scopeSummary}</p>
            </Section>

            {quote.assumptions.length > 0 && (
              <Section title="Assumptions">
                <BulletList items={quote.assumptions} />
              </Section>
            )}

            {quote.exclusions.length > 0 && (
              <Section title="Exclusions">
                <BulletList items={quote.exclusions} />
              </Section>
            )}

            {quote.risks.length > 0 && (
              <Section title="Risks & open questions">
                <BulletList items={quote.risks} />
              </Section>
            )}

            {milestones.length > 0 && (
              <Section title="Milestones & payment schedule">
                <div className="divide-y divide-ink/10 rounded border border-ink/10">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-ink">{m.title}</span>
                      <span className="font-mono text-steel">{m.amountCents ? formatCents(m.amountCents) : ""}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <p className="border-t border-ink/10 pt-5 text-xs text-steel">
              This quote has one exact price and must receive final BRIEVV team approval before client approval or
              payment. Qualified professionals remain
              responsible for professional work — AI assists estimation and workflow, it does not replace their
              judgment.
            </p>

            <QuoteActions quoteId={quote.id} quoteStatus={quote.status} isStaff={isStaff} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-5">
      <div className="mono-label">{label}</div>
      <div className="mt-2 font-mono text-lg text-ink">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mono-label mb-2.5">{title}</h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-inside list-disc space-y-1.5 text-sm text-ink">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
