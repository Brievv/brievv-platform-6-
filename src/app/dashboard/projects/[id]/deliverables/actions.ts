"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createDownloadUrl } from "@/server/services/storage/s3-storage";
import { scanObject } from "@/server/services/security/malware-scan";
import { notify } from "@/server/services/notifications/notify";

const STAFF_ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER"];

async function assertProjectAccess(projectId: string, userId: string, role: string) {
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");
  if (project.createdByUserId !== userId && !STAFF_ROLES.includes(role)) throw new Error("Forbidden");
  return project;
}

export interface AttachedFileInput {
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Creates the ProjectFile row for an object that's already been uploaded
 * to storage via the presigned-URL flow (see FileDropzone). Deliverables
 * are files placed in the DELIVERABLES folder (spec §18's five-folder
 * structure) — client inputs and working files use other folders and
 * aren't shown on this tab.
 */
export async function attachDeliverable(projectId: string, files: AttachedFileInput[]): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  try {
    const project = await assertProjectAccess(projectId, userId, role);

    for (const f of files) {
      const scan = await scanObject(f.storageKey).catch(() => ({ status: "pending" as const, provider: "error" }));
      await db.projectFile.create({
        data: {
          projectId,
          folder: "DELIVERABLES",
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes,
          storageKey: f.storageKey,
          uploadedById: userId,
          scanStatus: scan.status,
        },
      });
    }

    await db.auditLog.create({
      data: { actorId: userId, action: "deliverable.uploaded", entityType: "Project", entityId: projectId, metadata: { count: files.length } },
    });

    if (project.createdByUserId !== userId) {
      await notify({
        userId: project.createdByUserId,
        type: "deliverable_ready",
        title: "New deliverable uploaded",
        body: `${project.title} — ${files.length} file${files.length === 1 ? "" : "s"} added.`,
        link: `/dashboard/projects/${projectId}/deliverables`,
      });
    }

    revalidatePath(`/dashboard/projects/${projectId}/deliverables`);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not attach file." };
  }
}

/** Returns a short-lived signed download URL — the app never exposes a permanent object URL (spec §18). */
export async function getDeliverableDownloadUrl(projectId: string, fileId: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  try {
    await assertProjectAccess(projectId, userId, role);
    const file = await db.projectFile.findUnique({ where: { id: fileId } });
    if (!file || file.projectId !== projectId) return { ok: false, error: "File not found." };

    const url = await createDownloadUrl(file.storageKey);
    return { ok: true, url };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not generate a download link." };
  }
}
