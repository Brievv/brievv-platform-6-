import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

export default async function FilesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;

  const files = await db.projectFile.findMany({
    where: { project: { createdByUserId: userId } },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <DashboardTopbar title="Files" />
      <div className="mx-auto max-w-4xl px-6 py-10">
        {files.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <p className="text-sm text-steel">No files uploaded yet across your projects.</p>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="divide-y divide-ink/10 p-0">
              {files.map((f: (typeof files)[number]) => (
                <div key={f.id} className="flex items-center gap-3 px-6 py-3.5 text-sm">
                  <FileText size={16} className="flex-none text-steel" />
                  <span className="min-w-0 flex-1 truncate text-ink">{f.fileName}</span>
                  <Link href={`/dashboard/projects/${f.projectId}`} className="flex-none text-xs text-steel hover:text-orange">
                    {f.project.referenceCode}
                  </Link>
                  <Badge tone={f.scanStatus === "clean" ? "success" : f.scanStatus === "infected" ? "danger" : "neutral"}>
                    {f.scanStatus}
                  </Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
