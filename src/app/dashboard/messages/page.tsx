import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;

  const threads = await db.messageThread.findMany({
    where: { project: { createdByUserId: userId }, isInternal: false },
    include: { project: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <DashboardTopbar title="Messages" />
      <div className="mx-auto max-w-3xl px-6 py-10">
        {threads.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <p className="text-sm text-steel">
                No messages yet. Once your project team is assigned, you'll be able to message them here.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {threads.map((t: (typeof threads)[number]) => (
              <Link key={t.id} href={`/dashboard/projects/${t.projectId}/messages`}>
                <Card className="transition-colors hover:border-orange/40">
                  <CardBody>
                    <div className="font-medium text-ink">{t.project.title}</div>
                    {t.messages[0] && <p className="mt-1 truncate text-sm text-steel">{t.messages[0].body}</p>}
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
