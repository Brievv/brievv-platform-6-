import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { QuotePdfDocument, type QuotePdfData } from "@/server/services/pdf/quote-pdf";

/**
 * GET /api/v1/quotes/:id/pdf
 * Same ownership check as the quote page itself (spec §72) — a signed-in
 * user can only download PDFs for quotes on projects they created, or if
 * they're internal staff.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const quote = await db.quote.findUnique({ where: { id: params.id }, include: { project: true } });
  if (!quote) return NextResponse.json({ error: "Quote not found." }, { status: 404 });

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;
  const isStaff = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER"].includes(role);
  if (quote.project.createdByUserId !== userId && !isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: QuotePdfData = {
    quoteNumber: quote.quoteNumber,
    referenceCode: quote.project.referenceCode,
    projectTitle: quote.project.title,
    status: quote.status,
    priceLowCents: quote.priceLowCents,
    priceHighCents: quote.priceHighCents,
    timelineText: quote.timelineText,
    recommendedTeam: quote.recommendedTeam,
    scopeSummary: quote.scopeSummary,
    assumptions: quote.assumptions,
    exclusions: quote.exclusions,
    risks: quote.risks,
    expiresAt: quote.expiresAt ? quote.expiresAt.toISOString() : null,
    generatedAt: new Date().toLocaleString(),
  };

  const buffer = await renderToBuffer(<QuotePdfDocument data={data} />);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="BRIEVV-${quote.quoteNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
