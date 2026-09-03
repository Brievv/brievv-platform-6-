import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { ProjectTabs } from "@/components/features/project-tabs";
import { Activity as ActivityIcon } from "lucide-react";

const STAFF_ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER"];

interface TimelineEntry {
  id: string;
  label: string;
  actorName: string | null;
  createdAt: Date;
}

const ACTION_LABELS: Record<string, string> = {
  "quote.approved": "Quote approved",
  "quote.change_requested": "Changes requested on quote",
  "task.status_changed": "Task status changed",
  "milestone.completed": "Milestone marked complete",
  "milestone.reopened": "Milestone reopened",
  "deliverable.uploaded": "Deliverable uploaded",
  "payment.received": "Payment received",
};

/**
 * A real activity feed, not a placeholder — it's built from two tables
 * this app already writes to for other reasons: `ProjectStatusEvent`
 * (every status transition, written by the estimate/checkout/webhook/
 * quote-approval code paths) and `AuditLog` (written by every mutating
 * server action across tasks, milestones, deliverables, and quotes).
 * There's no separate "activity" table to keep in sync — this page just
 * reads the audit trail that already exists.
 */
export default async function ProjectActivityPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      statusHistory: { orderBy: { createdAt: "desc" } },
      tasks: { select: { id: true } },
      milestones: { select: { id: true } },
      quotes: { select: { id: true } },
      payments: { select: { id: true } },
    },
  });
  if (!project) notFound();
  if (project.createdByUserId !== userId && !STAFF_ROLES.includes(role)) notFound();

  const entityIdsByType: Record<string, string[]> = {
    Project: [project.id],
    ProjectTask: project.tasks.map((t: any) => t.id),
    ProjectMilestone: project.milestones.map((m: any) => m.id),
    Quote: project.quotes.map((q: any) => q.id),
    Payment: project.payments.map((p: any) => p.id),
  };

  const auditLogs = await db.auditLog.findMany({
    where: {
      OR: Object.entries(entityIdsByType)
        .filter(([, ids]) => ids.length > 0)
        .map(([entityType, ids]) => ({ entityType, entityId: { in: ids } })),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const actorIds = Array.from(new Set(auditLogs.map((l: any) => l.actorId).filter(Boolean))) as string[];
  const actors = actorIds.length ? await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } }) : [];
  const actorNameById = new Map(actors.map((a: any) => [a.id, a.name]));

  const statusEntries: TimelineEntry[] = project.statusHistory.map((h: any) => ({
    id: `status-${h.id}`,
    label: `Status changed to ${h.status.replace(/_/g, " ")}${h.note ? ` — ${h.note}` : ""}`,
    actorName: h.actorId ? actorNameById.get(h.actorId) ?? null : null,
    createdAt: h.createdAt,
  }));

  const auditEntries: TimelineEntry[] = auditLogs.map((l: any) => ({
    id: `audit-${l.id}`,
    label: ACTION_LABELS[l.action] ?? l.action.replace(/[._]/g, " "),
    actorName: l.actorId ? actorNameById.get(l.actorId) ?? null : null,
    createdAt: l.createdAt,
  }));

  const timeline = [...statusEntries, ...auditEntries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div>
      <DashboardTopbar title={project.title} />
      <ProjectTabs projectId={project.id} />
      <div className="mx-auto max-w-2xl px-6 py-10">
        {timeline.length === 0 ? (
          <p className="glass-surface rounded-md p-8 text-center text-sm text-steel">No activity recorded yet.</p>
        ) : (
          <ol className="space-y-0">
            {timeline.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 border-l border-ink/10 pb-5 pl-4 last:pb-0" style={{ marginLeft: -1 }}>
                <span className="-ml-[19px] mt-0.5 flex-none rounded-full bg-paper">
                  <ActivityIcon size={14} className="text-orange" />
                </span>
                <div>
                  <div className="text-sm text-ink">{entry.label}</div>
                  <div className="mt-0.5 font-mono text-[0.7rem] text-steel/70">
                    {entry.actorName ? `${entry.actorName} · ` : ""}
                    {entry.createdAt.toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
