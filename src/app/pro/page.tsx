import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_TONE: Record<string, "neutral" | "info" | "success" | "warning" | "danger"> = {
  APPLIED: "neutral",
  UNDER_REVIEW: "warning",
  DOCUMENTS_REQUIRED: "warning",
  VERIFICATION_PENDING: "warning",
  VERIFIED: "info",
  ACTIVE: "success",
  PAUSED: "neutral",
  SUSPENDED: "danger",
  REJECTED: "danger",
};

export default async function ProOverviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;

  const profile = await db.professionalProfile.findUnique({
    where: { userId },
    include: {
      disciplines: { include: { discipline: true } },
      assignments: { where: { status: "PROPOSED" }, include: { project: true } },
    },
  });

  if (!profile) {
    return (
      <div>
        <DashboardTopbar title="Overview" />
        <div className="mx-auto max-w-2xl px-6 py-10">
          <Card>
            <CardBody className="text-center">
              <p className="text-sm text-steel">No professional profile found on this account.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardTopbar title="Overview" />
      <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mono-label">Verification status</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.disciplines.map((d: any) => (
                  <Badge key={d.disciplineId}>{d.discipline.name}</Badge>
                ))}
              </div>
            </div>
            <Badge tone={STATUS_TONE[profile.status] ?? "neutral"}>{profile.status.replace(/_/g, " ")}</Badge>
          </CardBody>
        </Card>

        {profile.status === "APPLIED" || profile.status === "UNDER_REVIEW" ? (
          <div className="rounded border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-ink">
            Your application is under review. You'll be eligible for project matching once verified.
          </div>
        ) : profile.status === "DOCUMENTS_REQUIRED" ? (
          <div className="rounded border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-ink">
            BRIEVV needs additional documents before verifying your account.{" "}
            <Link href="/pro/verification" className="font-medium text-orange hover:underline">
              Upload documents →
            </Link>
          </div>
        ) : null}

        <Card>
          <CardBody>
            <h2 className="mono-label mb-4">Pending assignment proposals ({profile.assignments.length})</h2>
            {profile.assignments.length === 0 ? (
              <p className="text-sm text-steel">No pending proposals right now.</p>
            ) : (
              <ul className="divide-y divide-ink/10">
                {profile.assignments.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-ink">{a.project.title}</span>
                    <Link href="/pro/assignments" className="text-orange hover:underline">
                      Review →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="flex gap-3 text-sm">
          <span className="text-steel">Completed projects: {profile.completedProjects}</span>
          {profile.qualityScore !== null && <span className="text-steel">· Quality score: {profile.qualityScore.toFixed(1)}/5</span>}
        </div>
      </div>
    </div>
  );
}
