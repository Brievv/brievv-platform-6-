import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { ProjectTabs } from "@/components/features/project-tabs";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STAFF_ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER"];

export default async function ProjectTeamPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      assignments: { where: { status: "ACCEPTED" }, include: { professional: { include: { user: true } } } },
      members: true,
    },
  });
  if (!project) notFound();
  if (project.createdByUserId !== userId && !STAFF_ROLES.includes(role)) notFound();

  const client = await db.user.findUnique({ where: { id: project.createdByUserId } });

  return (
    <div>
      <DashboardTopbar title={project.title} />
      <ProjectTabs projectId={project.id} />
      <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
        <Card>
          <CardBody>
            <h2 className="mono-label mb-4">Client</h2>
            {client && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink">{client.name}</span>
                <span className="text-steel">{client.email}</span>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mono-label mb-4">Assigned professionals ({project.assignments.length})</h2>
            {project.assignments.length === 0 ? (
              <p className="text-sm text-steel">
                No professionals assigned yet — matching happens from the ops side once the project is
                ready.
              </p>
            ) : (
              <ul className="divide-y divide-ink/10">
                {project.assignments.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <div className="text-ink">{a.professional.user.name}</div>
                      <div className="text-xs text-steel">{a.roleOnProject}</div>
                    </div>
                    <Badge tone="success">Active</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
