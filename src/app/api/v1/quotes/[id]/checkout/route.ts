import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createDepositCheckoutSession, StripeNotConfiguredError } from "@/server/services/payments/stripe";
import { env } from "@/lib/env";

const DEPOSIT_PERCENT = 30; // configurable in a future admin "Pricing Rules" page — see docs/ROADMAP.md

/**
 * POST /api/v1/quotes/:id/checkout
 *
 * Per spec §13/§14: a project must not begin paid execution until the
 * correct payment condition is met. This route can only be called once
 * the quote's status is already ACCEPTED (set by the approve-quote server
 * action) — attempting checkout on a quote that hasn't been approved is
 * rejected outright, so there's no path that skips approval and jumps
 * straight to payment.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const userId = (session.user as any).id as string;

  const quote = await db.quote.findUnique({ where: { id: params.id }, include: { project: true } });
  if (!quote) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  if (quote.project.createdByUserId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (quote.status !== "ACCEPTED" || !quote.reviewedAt) {
    return NextResponse.json({ error: "This quote must receive final BRIEVV team approval before checkout can start." }, { status: 409 });
  }

  const depositCents = Math.round(quote.priceLowCents * (DEPOSIT_PERCENT / 100));

  try {
    const { url, sessionId } = await createDepositCheckoutSession({
      projectId: quote.projectId,
      quoteId: quote.id,
      projectTitle: quote.project.title,
      amountCents: depositCents,
      clientEmail: session.user.email ?? "",
      successUrl: `${env.APP_URL}/dashboard/projects/${quote.projectId}?checkout=success`,
      cancelUrl: `${env.APP_URL}/dashboard/quotes/${quote.id}?checkout=cancelled`,
    });

    await db.project.update({
      where: { id: quote.projectId },
      data: { status: "PAYMENT_PENDING", statusHistory: { create: { status: "PAYMENT_PENDING", actorId: userId } } },
    });

    await db.payment.create({
      data: {
        projectId: quote.projectId,
        kind: "DEPOSIT",
        status: "PENDING",
        amountCents: depositCents,
        stripeCheckoutSessionId: sessionId,
      },
    });

    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return NextResponse.json(
        { error: "Payments aren't configured yet in this environment.", detail: err.message, code: "STRIPE_NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    // eslint-disable-next-line no-console
    console.error("Failed to create checkout session", err);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }
}
