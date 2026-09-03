import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { NotificationBell } from "@/components/features/notification-bell";

export default async function AdminFilesPage() {
  const files = await db.projectFile.findMany({
    include: { project: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Files</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 p-6 lg:p-8">
        {files.length === 0 ? (
          <p className="text-sm text-steel">No files uploaded across the platform yet.</p>
        ) : (
          <div className="divide-y divide-ink/10 rounded-md border border-ink/10 bg-white">
            {files.map((f: any) => (
              <div key={f.id} className="flex items-center gap-3 px-5 py-3.5 text-sm">
                <FileText size={16} className="flex-none text-steel" />
                <span className="min-w-0 flex-1 truncate text-ink">{f.fileName}</span>
                <span className="font-mono text-xs text-steel">{f.folder.replace(/_/g, " ")}</span>
                <Link href={`/dashboard/projects/${f.projectId}`} className="text-xs text-steel hover:text-orange">
                  {f.project.referenceCode}
                </Link>
                <Badge tone={f.scanStatus === "clean" ? "success" : f.scanStatus === "infected" ? "danger" : "neutral"}>{f.scanStatus}</Badge>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
