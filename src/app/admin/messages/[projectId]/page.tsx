import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AdminComposer } from "./admin-composer";
import { NotificationBell } from "@/components/features/notification-bell";

export default async function AdminProjectMessagesPage({ params }: { params: { projectId: string } }) {
  const project = await db.project.findUnique({ where: { id: params.projectId } });
  if (!project) notFound();

  const [clientThread, internalThread] = await Promise.all([
    db.messageThread.findFirst({ where: { projectId: project.id, isInternal: false }, include: { messages: { orderBy: { createdAt: "asc" } } } }),
    db.messageThread.findFirst({ where: { projectId: project.id, isInternal: true }, include: { messages: { orderBy: { createdAt: "asc" } } } }),
  ]);

  const senderIds = Array.from(
    new Set([...(clientThread?.messages ?? []), ...(internalThread?.messages ?? [])].map((m: any) => m.senderId))
  );
  const senders = senderIds.length ? await db.user.findMany({ where: { id: { in: senderIds } }, select: { id: true, name: true } }) : [];
  const nameById = new Map<string, string>(senders.map((s: any) => [s.id, s.name]));

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">{project.title}</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 gap-6 p-6 lg:flex lg:p-8">
        <div className="mb-6 flex-1 lg:mb-0">
          <div className="mono-label mb-3">Client thread — visible to the client</div>
          <div className="flex h-96 flex-col rounded-md border border-ink/10 bg-white">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {(clientThread?.messages ?? []).map((m: any) => (
                <div key={m.id} className="text-sm">
                  <span className="mono-label">{nameById.get(m.senderId) ?? "Unknown"}</span>
                  <div className="mt-0.5 text-ink">{m.body}</div>
                </div>
              ))}
              {!clientThread?.messages.length && <p className="text-sm text-steel">No messages yet.</p>}
            </div>
            <AdminComposer projectId={project.id} internal={false} />
          </div>
        </div>

        <div className="flex-1">
          <div className="mono-label mb-3 text-warning">Internal notes — never shown to the client</div>
          <div className="flex h-96 flex-col rounded-md border border-warning/30 bg-warning/[0.03]">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {(internalThread?.messages ?? []).map((m: any) => (
                <div key={m.id} className="text-sm">
                  <span className="mono-label">{nameById.get(m.senderId) ?? "Unknown"}</span>
                  <div className="mt-0.5 text-ink">{m.body}</div>
                </div>
              ))}
              {!internalThread?.messages.length && <p className="text-sm text-steel">No internal notes yet.</p>}
            </div>
            <AdminComposer projectId={project.id} internal={true} />
          </div>
        </div>
      </main>
    </>
  );
}
