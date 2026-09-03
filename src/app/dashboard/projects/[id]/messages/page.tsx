import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardTopbar } from "@/components/layout/dashboard-shell";
import { ProjectTabs } from "@/components/features/project-tabs";
import { MessageComposer } from "./message-composer";

const STAFF_ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER"];

export default async function ProjectMessagesPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const project = await db.project.findUnique({ where: { id: params.id } });
  if (!project) notFound();
  if (project.createdByUserId !== userId && !STAFF_ROLES.includes(role)) notFound();

  // Only the client-facing thread is ever queried here — isInternal: true
  // threads (ops-only discussion) are never fetched by this page, by
  // design (spec §29, §72).
  const thread = await db.messageThread.findFirst({
    where: { projectId: project.id, isInternal: false },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  const senderIds = thread ? Array.from(new Set(thread.messages.map((m: any) => m.senderId))) : [];
  const senders = senderIds.length ? await db.user.findMany({ where: { id: { in: senderIds } }, select: { id: true, name: true, role: true } }) : [];
  const senderById = new Map<string, { id: string; name: string; role: string }>(senders.map((s: any) => [s.id, s]));

  return (
    <div>
      <DashboardTopbar title={project.title} />
      <ProjectTabs projectId={project.id} />
      <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-2xl flex-col px-6 py-8">
        <div className="glass-surface flex flex-1 flex-col overflow-hidden rounded-md">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {!thread || thread.messages.length === 0 ? (
              <p className="py-12 text-center text-sm text-steel">
                No messages yet. Once your project team is assigned, you can message them here.
              </p>
            ) : (
              thread.messages.map((m: any) => {
                const sender = senderById.get(m.senderId);
                const mine = m.senderId === userId;
                return (
                  <div key={m.id} className={mine ? "ml-auto max-w-[80%] text-right" : "mr-auto max-w-[80%]"}>
                    <div className="mono-label mb-1">{sender?.name ?? "Unknown"}</div>
                    <div className={`inline-block rounded-md px-3.5 py-2.5 text-sm ${mine ? "bg-ink text-white" : "bg-white text-ink"}`}>
                      {m.body}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <MessageComposer projectId={project.id} />
        </div>
      </div>
    </div>
  );
}
