import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;

  const payments = await db.payment.findMany({
    where: { project: { createdByUserId: userId } },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <DashboardTopbar title="Payments" />
      <div className="mx-auto max-w-3xl px-6 py-10">
        {payments.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <p className="text-sm text-steel">No payments yet.</p>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="divide-y divide-ink/10 p-0">
              {payments.map((p: (typeof payments)[number]) => (
                <div key={p.id} className="flex items-center justify-between px-6 py-3.5 text-sm">
                  <div>
                    <div className="text-ink">{p.project.title}</div>
                    <div className="mono-label mt-0.5">{p.kind.replace(/_/g, " ")}</div>
                  </div>
                  <span className="font-mono text-steel">{formatCents(p.amountCents)}</span>
                  <Badge tone={p.status === "PAID" ? "success" : p.status === "FAILED" ? "danger" : "neutral"}>{p.status}</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
