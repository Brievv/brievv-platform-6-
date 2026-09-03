import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviteForm } from "./invite-form";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;

  const membership = await db.organizationMember.findFirst({ where: { userId }, include: { organization: true } });
  const members = membership
    ? await db.organizationMember.findMany({ where: { organizationId: membership.organizationId }, include: { user: true } })
    : [];

  return (
    <div>
      <DashboardTopbar title="Team" />
      <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
        <Card>
          <CardBody>
            <h2 className="mono-label mb-4">Invite a teammate</h2>
            <InviteForm />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-0">
            {members.length === 0 ? (
              <p className="p-6 text-sm text-steel">
                {membership ? "No teammates yet." : "Set a company name in onboarding, or invite someone below to create your organization."}
              </p>
            ) : (
              <ul className="divide-y divide-ink/10">
                {members.map((m: (typeof members)[number]) => (
                  <li key={m.id} className="flex items-center justify-between px-6 py-3.5 text-sm">
                    <div>
                      <div className="text-ink">{m.user.name}</div>
                      <div className="text-xs text-steel">{m.user.email}</div>
                    </div>
                    <Badge>{m.role.replace(/_/g, " ")}</Badge>
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
