import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

export default async function ProjectsListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;

  const projects = await db.project.findMany({
    where: { createdByUserId: userId },
    include: { disciplines: { include: { discipline: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <DashboardTopbar title="Projects" />
      <div className="mx-auto max-w-4xl px-6 py-10">
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {projects.map((p: (typeof projects)[number]) => (
              <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
                <Card className="transition-colors hover:border-orange/40">
                  <CardBody className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="mono-label">{p.referenceCode}</div>
                      <div className="mt-1 font-medium text-ink">{p.title}</div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {p.disciplines.map((d: (typeof p.disciplines)[number]) => (
                          <Badge key={d.disciplineId}>{d.discipline.name}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge tone="dark">{p.status.replace(/_/g, " ")}</Badge>
                      <div className="mt-1.5 font-mono text-xs text-steel">{timeAgo(p.createdAt)}</div>
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

function EmptyState() {
  return (
    <Card>
      <CardBody className="py-12 text-center">
        <p className="text-sm text-steel">No projects yet.</p>
        <Link href="/start" className="mt-3 inline-block text-sm font-medium text-orange hover:underline">
          Start your first project →
        </Link>
      </CardBody>
    </Card>
  );
}
