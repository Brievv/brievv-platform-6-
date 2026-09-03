import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { analyzeProjectFile, isContentAnalyzable } from "@/server/services/ai/document-analysis";
import { env } from "@/lib/env";

const STAFF_ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER"];

/**
 * POST /api/v1/files/:fileId/analyze
 *
 * Runs document-content analysis (spec §11) on one uploaded file. Kept as
 * an explicit, on-demand action rather than automatic on every upload —
 * analysis costs an AI call and most uploads (reference photos, existing
 * survey PDFs a client just wants stored) don't need it. The UI surfaces
 * this as an "Analyze" button in the file list.
 */
export async function POST(_req: NextRequest, { params }: { params: { fileId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const file = await db.projectFile.findUnique({
    where: { id: params.fileId },
    include: { project: { include: { disciplines: { include: { discipline: true } } } } },
  });
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });
  if (file.project.createdByUserId !== userId && !STAFF_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isContentAnalyzable(file.mimeType)) {
    return NextResponse.json(
      { error: `File type "${file.mimeType}" doesn't have an extractable text layer to analyze. This covers PDFs today.` },
      { status: 422 }
    );
  }

  try {
    const result = await analyzeProjectFile({
      storageKey: file.storageKey,
      mimeType: file.mimeType,
      projectTitle: file.project.title,
      projectDisciplines: file.project.disciplines.map((d: (typeof file.project.disciplines)[number]) => d.discipline.name),
    });

    if (!result) {
      return NextResponse.json({ error: "No extractable text found in this file (likely a scanned/image-only PDF)." }, { status: 422 });
    }

    const analysis = await db.aIAnalysis.create({
      data: {
        projectId: file.projectId,
        fileId: file.id,
        provider: env.AI_PROVIDER,
        model: env.AI_MODEL,
        promptVersion: "document-v1",
        inputSummary: { fileName: file.fileName, mimeType: file.mimeType },
        rawResponse: result as unknown as object,
        identifiedDisciplines: result.identifiedDiscipline ? [result.identifiedDiscipline] : [],
        assumptions: result.expectedDeliverables,
        missingInformation: result.missingInformation,
        risks: result.inconsistencies,
        requiresHumanReview: true, // spec §11: AI assists, never replaces professional judgment
      },
    });

    await db.auditLog.create({
      data: { actorId: userId, action: "file.analyzed", entityType: "ProjectFile", entityId: file.id },
    });

    return NextResponse.json({ analysisId: analysis.id, result });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Document analysis failed", err);
    return NextResponse.json({ error: "Analysis failed. The file may be corrupted or password-protected." }, { status: 500 });
  }
}
