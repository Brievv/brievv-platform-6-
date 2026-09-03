import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;

  const memberships = await db.organizationMember.findMany({ where: { userId }, select: { organizationId: true } });
  const orgIds = memberships.map((m: (typeof memberships)[number]) => m.organizationId);

  const invoices = orgIds.length ? await db.invoice.findMany({ where: { organizationId: { in: orgIds } }, orderBy: { createdAt: "desc" } }) : [];

  return (
    <div>
      <DashboardTopbar title="Invoices" />
      <div className="mx-auto max-w-3xl px-6 py-10">
        {invoices.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <p className="text-sm text-steel">No invoices yet.</p>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="divide-y divide-ink/10 p-0">
              {invoices.map((inv: (typeof invoices)[number]) => (
                <div key={inv.id} className="flex items-center justify-between px-6 py-3.5 text-sm">
                  <span className="text-ink">{inv.invoiceNumber}</span>
                  <span className="font-mono text-steel">{formatCents(inv.amountCents)}</span>
                  <Badge tone={inv.status === "PAID" ? "success" : inv.status === "OVERDUE" ? "danger" : "neutral"}>{inv.status}</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
