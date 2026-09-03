import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildObjectKey, createUploadUrl, StorageNotConfiguredError } from "@/server/services/storage/s3-storage";
import { validateUploadRequest } from "@/server/services/storage/upload-validation";

/**
 * POST /api/v1/uploads/presign
 *
 * Returns a presigned PUT URL the browser uploads directly to — file bytes
 * never pass through this Next.js server (spec §18).
 *
 * Two mutually exclusive scopes:
 *  - `intakeId`: pre-project uploads from the /start wizard, before a
 *    Project row exists. /api/v1/ai/estimate re-associates these objects
 *    with the real Project once it's created.
 *  - `projectId`: uploads directly into an existing project's workspace
 *    (e.g. a deliverable attached from the project workspace). Requires an
 *    authenticated session that owns the project or is internal staff —
 *    this is the one path here that needs an authorization check, since
 *    unlike a fresh intake, a projectId names a specific existing project.
 */
const STAFF_ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER"];

const requestSchema = z
  .object({
    intakeId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
    verification: z.literal(true).optional(),
    fileName: z.string().min(1).max(200),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().positive(),
  })
  .refine((v) => [v.intakeId, v.projectId, v.verification].filter(Boolean).length === 1, {
    message: "Provide exactly one of intakeId, projectId, or verification",
  });

export async function POST(req: NextRequest) {
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }
  const { intakeId, projectId, verification, fileName, mimeType, sizeBytes } = parsed.data;

  const validation = validateUploadRequest({ fileName, mimeType, sizeBytes });
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 422 });
  }

  let key: string;
  if (verification) {
    // Verification documents (spec §21) are scoped to the uploader's own
    // user ID — a professional can only ever get a presigned URL for
    // their own verification folder, never anyone else's.
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const userId = (session.user as any).id as string;
    key = buildObjectKey({ scope: "verification", scopeId: userId, fileName });
  } else if (projectId) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const userId = (session.user as any).id as string;
    const role = (session.user as any).role as string;

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    if (project.createdByUserId !== userId && !STAFF_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    key = buildObjectKey({ scope: "projects", scopeId: projectId, fileName });
  } else {
    key = buildObjectKey({ scope: "intake", scopeId: intakeId!, fileName });
  }

  const fileId = uuid(); // client-side reference used to track upload progress/state before any DB row exists

  try {
    const { url, expiresInSeconds } = await createUploadUrl({ key, mimeType });
    return NextResponse.json({ fileId, storageKey: key, uploadUrl: url, expiresInSeconds });
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      return NextResponse.json(
        {
          error: "File storage isn't configured yet.",
          detail: err.message,
          code: "STORAGE_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }
    // eslint-disable-next-line no-console
    console.error("Failed to create presigned upload URL", err);
    return NextResponse.json({ error: "Could not prepare the upload. Please try again." }, { status: 500 });
  }
}
