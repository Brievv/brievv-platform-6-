import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle, FileText } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { ProjectTabs } from "@/components/features/project-tabs";
import { FileRow } from "@/components/features/file-row";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";

/**
 * Project overview — the first tab of what the full spec §15 workspace
 * (Overview / Tasks / Milestones / Files / Messages / Team / Deliverables
 * / Payments / Activity / Issues / Approvals) will eventually be. Built
 * for real against the database now; the remaining tabs are Phase 3 work
 * tracked in docs/ROADMAP.md.
 */

const STATUS_SEQUENCE = [
  "SUBMITTED",
  "ANALYZING",
  "QUOTE_READY",
  "QUOTE_ACCEPTED",
  "PAYMENT_PENDING",
  "READY_TO_START",
  "MATCHING",
  "TEAM_ASSIGNED",
  "IN_PROGRESS",
  "INTERNAL_REVIEW",
  "CLIENT_REVIEW",
  "FINAL_QA",
  "DELIVERED",
  "COMPLETED",
];

export default async function ProjectOverviewPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { checkout?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;
  const isStaff = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER"].includes(role);

  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      disciplines: { include: { discipline: true } },
      quotes: { orderBy: { createdAt: "desc" }, take: 1 },
      files: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!project) notFound();
  if (project.createdByUserId !== userId && !isStaff) notFound();

  const latestQuote = project.quotes[0];
  const currentIndex = STATUS_SEQUENCE.indexOf(project.status);

  return (
    <div>
      <DashboardTopbar title={project.title} />
      <ProjectTabs projectId={project.id} />
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        {searchParams.checkout === "success" && (
          <div className="rounded border border-success/30 bg-success/5 px-4 py-3 text-sm text-ink">
            Payment received — BRIEVV is assembling your project team.
          </div>
        )}
        {searchParams.checkout === "cancelled" && (
          <div className="rounded border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-ink">
            Checkout was cancelled. You can restart it any time from your quote.
          </div>
        )}

        <Card>
          <CardBody>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mono-label">{project.referenceCode}</div>
                <h1 className="mt-1 font-display text-2xl font-medium text-ink">{project.title}</h1>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {project.disciplines.map((d: (typeof project.disciplines)[number]) => (
                    <Badge key={d.disciplineId}>{d.discipline.name}</Badge>
                  ))}
                </div>
              </div>
              <Badge tone="dark">{project.status.replace(/_/g, " ")}</Badge>
            </div>

            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-steel">{project.scopeDescription}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mono-label mb-5">Project timeline</h2>
            <ol className="space-y-0">
              {STATUS_SEQUENCE.map((status, i) => {
                const done = currentIndex >= 0 && i <= currentIndex;
                const historyEvent = project.statusHistory.find((h: (typeof project.statusHistory)[number]) => h.status === status);
                return (
                  <li key={status} className="flex items-start gap-3 border-l border-ink/10 pb-5 pl-4 last:pb-0" style={{ marginLeft: -1 }}>
                    <span className="-ml-[21px] mt-0.5 flex-none rounded-full bg-paper">
                      {done ? <CheckCircle2 size={16} className="text-success" /> : <Circle size={16} className="text-ink/20" />}
                    </span>
                    <div>
                      <div className={done ? "text-sm text-ink" : "text-sm text-steel/60"}>{status.replace(/_/g, " ")}</div>
                      {historyEvent && (
                        <div className="font-mono text-[0.7rem] text-steel/60">{new Date(historyEvent.createdAt).toLocaleString()}</div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardBody>
        </Card>

        {latestQuote && (
          <Card>
            <CardBody className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="mono-label">Latest quote · {latestQuote.quoteNumber}</div>
                <div className="mt-1 font-mono text-lg text-ink">
                  {formatCents(latestQuote.priceLowCents)}–{formatCents(latestQuote.priceHighCents)}
                </div>
              </div>
              <Link href={`/dashboard/quotes/${latestQuote.id}`} className="text-sm font-medium text-orange hover:underline">
                View quote →
              </Link>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <h2 className="mono-label mb-4">Files ({project.files.length})</h2>
            {project.files.length === 0 ? (
              <p className="text-sm text-steel">No files uploaded yet.</p>
            ) : (
              <ul className="divide-y divide-ink/10">
                {project.files.map((f: (typeof project.files)[number]) => (
                  <FileRow key={f.id} fileId={f.id} fileName={f.fileName} mimeType={f.mimeType} scanStatus={f.scanStatus} />
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {project.payments.length > 0 && (
          <Card>
            <CardBody>
              <h2 className="mono-label mb-4">Payments</h2>
              <ul className="divide-y divide-ink/10">
                {project.payments.map((p: (typeof project.payments)[number]) => (
                  <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-ink">{p.kind.replace(/_/g, " ")}</span>
                    <span className="font-mono text-steel">{formatCents(p.amountCents)}</span>
                    <Badge tone={p.status === "PAID" ? "success" : p.status === "FAILED" ? "danger" : "neutral"}>{p.status}</Badge>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
