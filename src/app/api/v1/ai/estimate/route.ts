import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateEstimate, briefInputSchema } from "@/server/services/ai/estimator";
import { formatReferenceCode, formatCents } from "@/lib/utils";
import { scanObject } from "@/server/services/security/malware-scan";
import { notify, notifyOps } from "@/server/services/notifications/notify";

/**
 * POST /api/v1/ai/estimate
 *
 * This is the ONLY path from the browser to an AI provider. The client
 * never calls Anthropic/OpenAI directly — it posts the brief here, and
 * this route (running on the server) holds the AI_API_KEY and does the
 * actual call via src/server/services/ai/estimator.ts.
 *
 * Order of operations matters (spec §46 — AI failure fallback):
 *   1. Validate input.
 *   2. Persist the Project row FIRST, status SUBMITTED.
 *   3. Only then call the estimator. If the AI call fails, the project
 *      is already safely in the database with status ANALYZING /
 *      AI_ANALYSIS_PENDING — nothing the client typed is ever lost.
 */

const requestSchema = briefInputSchema.extend({
  companyName: z.string().optional().default(""),
  location: z.string().optional().default(""),
  contactName: z.string().optional().default("Project contact"),
  contactEmail: z.string().optional().default("brief@brievv.dev"),
  contactPhone: z.string().optional().default(""),
  uploadedFiles: z
    .array(
      z.object({
        storageKey: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number().int().nonnegative().default(0),
      })
    )
    .default([]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;

  // --- Step 1: resolve/create the disciplines referenced (admin-configurable, spec §1) ---
  const disciplineRows = await Promise.all(
    data.disciplines.map((name) =>
      db.discipline.upsert({
        where: { name },
        update: {},
        create: { name, slug: slugify(name) },
      })
    )
  );

  // --- Step 2: persist the project BEFORE calling AI (spec §46) ---
  const sequence = await nextProjectSequence();
  const project = await db.project.create({
    data: {
      referenceCode: formatReferenceCode(sequence),
      createdByUserId: session?.user ? (session.user as any).id : SYSTEM_ANONYMOUS_USER_ID,
      title: data.title,
      companyName: data.companyName,
      location: data.location,
      projectType: data.projectType,
      scopeDescription: data.scopeDescription,
      jurisdiction: data.jurisdiction,
      requiredSoftware: data.requiredSoftware ?? [],
      budgetLow: data.budgetLowCents,
      budgetHigh: data.budgetHighCents,
      urgency: data.urgency,
      status: "ANALYZING",
      disciplines: { create: disciplineRows.map((d) => ({ disciplineId: d.id })) },
      statusHistory: { create: [{ status: "SUBMITTED" }, { status: "ANALYZING" }] },
    },
  });

  // --- Step 2.5: attach any files uploaded during the intake wizard ---
  // These objects already exist in storage (uploaded directly via
  // presigned URL — see /api/v1/uploads/presign); we're only creating the
  // database rows that associate them with this project now that one exists.
  for (const f of data.uploadedFiles) {
    const scan = await scanObject(f.storageKey).catch((err) => {
      // A scan-provider error must never block the brief from being saved —
      // the file simply stays in "pending" until ops or a retry job resolves it.
      // eslint-disable-next-line no-console
      console.error("Malware scan failed, leaving file pending review", err);
      return { status: "pending" as const, provider: "error" };
    });

    await db.projectFile.create({
      data: {
        projectId: project.id,
        folder: "CLIENT_INPUTS",
        fileName: f.fileName,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
        storageKey: f.storageKey,
        uploadedById: session?.user ? (session.user as any).id : SYSTEM_ANONYMOUS_USER_ID,
        scanStatus: scan.status,
      },
    });
  }

  // --- Step 3: run the estimation pipeline ---
  const estimate = await generateEstimate(data);

  await db.aIAnalysis.create({
    data: {
      projectId: project.id,
      provider: process.env.AI_PROVIDER ?? "anthropic",
      model: process.env.AI_MODEL ?? "unknown",
      promptVersion: "v1",
      inputSummary: data as unknown as object,
      rawResponse: (estimate.rawModelResponse ?? {}) as object,
      identifiedDisciplines: data.disciplines,
      assumptions: estimate.assumptions,
      missingInformation: estimate.missingInformation,
      risks: estimate.risks,
      requiresHumanReview: estimate.requiresHumanReview,
    },
  });

  if (estimate.status === "AI_ANALYSIS_PENDING") {
    await db.project.update({
      where: { id: project.id },
      data: { status: "SUBMITTED", statusHistory: { create: { status: "SUBMITTED", note: "AI analysis pending — queued for manual estimate" } } },
    });

    return NextResponse.json({
      status: "AI_ANALYSIS_PENDING",
      referenceCode: project.referenceCode,
      message: "Your brief was received successfully. Our team is completing the estimate manually.",
    });
  }

  const quote = await db.quote.create({
    data: {
      projectId: project.id,
      quoteNumber: `Q-${project.referenceCode}`,
      status: "PENDING_REVIEW",
      priceLowCents: estimate.priceLowCents,
      priceHighCents: estimate.priceHighCents,
      timelineText: estimate.timelineText,
      recommendedTeam: estimate.recommendedTeam,
      scopeSummary: estimate.scopeSummary,
      assumptions: estimate.assumptions,
      exclusions: [],
      risks: estimate.risks,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await db.project.update({
    where: { id: project.id },
    data: {
      status: "ANALYZING",
      statusHistory: { create: { status: "ANALYZING", note: "Quote sent to BRIEVV team for final approval" } },
    },
  });

  await notifyOps({
    type: "brief_submitted",
    title: "Brief awaiting final approval",
    body: `${project.title} — exact quote ${formatCents(quote.priceLowCents)} requires team review before project start.`,
    link: `/admin/quotes`,
  });

  if (project.createdByUserId !== SYSTEM_ANONYMOUS_USER_ID) {
    await notify({
      userId: project.createdByUserId,
      type: "quote_ready",
      title: "Your quote is ready",
      body: `${project.title} — exact quote ${formatCents(quote.priceLowCents)} is awaiting final team approval.`,
      link: `/dashboard/quotes/${quote.id}`,
    });
  }

  return NextResponse.json({
    status: quote.status,
    referenceCode: project.referenceCode,
    projectId: project.id,
    quoteId: quote.id,
    priceLowCents: quote.priceLowCents,
    priceHighCents: quote.priceHighCents,
    exactPriceCents: quote.priceLowCents,
    timeline: quote.timelineText,
    team: quote.recommendedTeam,
    scopeSummary: quote.scopeSummary,
    assumptions: quote.assumptions,
    risks: quote.risks,
    requiresHumanReview: estimate.requiresHumanReview,
  });
}
// Placeholder for unauthenticated brief submissions (public intake form,
// before account creation) — in production this should map to a real
// "system" service account row seeded in prisma/seed.ts.
const SYSTEM_ANONYMOUS_USER_ID = "00000000-0000-0000-0000-000000000000";

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function nextProjectSequence(): Promise<number> {
  const count = await db.project.count();
  return count + 1;
}
