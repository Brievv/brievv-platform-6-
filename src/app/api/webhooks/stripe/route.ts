import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature, calculatePlatformFeeCents } from "@/server/services/payments/stripe";
import { notify, notifyOps } from "@/server/services/notifications/notify";

/**
 * POST /api/webhooks/stripe
 *
 * Security requirements this route must satisfy (spec §49):
 *  1. Verify the Stripe-Signature header against STRIPE_WEBHOOK_SECRET
 *     before trusting anything in the payload.
 *  2. Idempotency: Stripe retries webhook delivery on anything but a 2xx
 *     response, and can also send duplicate events. We record every
 *     event's Stripe event ID in WebhookEvent (unique) and short-circuit
 *     if we've already processed it — so a retried delivery never
 *     double-credits a payment or double-advances a project's status.
 *
 * This route needs the RAW request body (not JSON-parsed) to verify the
 * signature. Unlike the Pages Router, Next.js App Router route handlers
 * don't parse the body automatically — calling `req.text()` below already
 * gives us the raw, unmodified payload Stripe signed.
 */
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe-Signature header" }, { status: 400 });

  const rawBody = await req.text();

  let event;
  try {
    event = verifyWebhookSignature(rawBody, signature);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // --- Idempotency check ---
  const existing = await db.webhookEvent.findUnique({ where: { externalId: event.id } });
  if (existing?.processedAt) {
    return NextResponse.json({ received: true, deduped: true });
  }

  await db.webhookEvent.upsert({
    where: { externalId: event.id },
    update: {},
    create: { source: "stripe", eventType: event.type, externalId: event.id, payload: event as unknown as object },
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const sessionId = session.id as string;
        const paymentIntentId = (session.payment_intent as string) ?? null;
        const projectId = session.metadata?.projectId as string | undefined;

        const payment = await db.payment.findUnique({ where: { stripeCheckoutSessionId: sessionId } });
        if (!payment) {
          // eslint-disable-next-line no-console
          console.error(`Webhook checkout.session.completed for unknown session ${sessionId}`);
          break;
        }

        const platformFeeCents = calculatePlatformFeeCents(payment.amountCents);

        await db.$transaction([
          db.payment.update({
            where: { id: payment.id },
            data: {
              status: "PAID",
              stripePaymentIntentId: paymentIntentId,
              platformFeeCents,
            },
          }),
          ...(projectId
            ? [
                db.project.update({
                  where: { id: projectId },
                  data: {
                    status: "READY_TO_START",
                    statusHistory: { create: { status: "READY_TO_START", note: "Deposit payment received" } },
                  },
                }),
              ]
            : []),
          db.auditLog.create({
            data: { action: "payment.received", entityType: "Payment", entityId: payment.id, metadata: { sessionId } },
          }),
        ]);

        if (projectId) {
          const project = await db.project.findUnique({ where: { id: projectId } });
          if (project) {
            await notify({
              userId: project.createdByUserId,
              type: "payment_received",
              title: "Payment received — project starting",
              body: `${project.title} — your deposit has been received. BRIEVV is assembling your team.`,
              link: `/dashboard/projects/${project.id}`,
            });
            await notifyOps({
              type: "payment_received",
              title: "Deposit received",
              body: `${project.title} — ready for matching.`,
              link: `/admin/matching`,
            });
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as any;
        const payment = await db.payment.findFirst({ where: { stripePaymentIntentId: intent.id } });
        if (payment) {
          await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as any;
        const payment = await db.payment.findFirst({ where: { stripeChargeId: charge.id } });
        if (payment) {
          const fullyRefunded = charge.amount_refunded >= charge.amount;
          await db.payment.update({
            where: { id: payment.id },
            data: { status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED" },
          });
        }
        break;
      }

      default:
        // Unhandled event types are acknowledged (2xx) so Stripe doesn't
        // retry them, but not treated as an error.
        break;
    }

    await db.webhookEvent.update({ where: { externalId: event.id }, data: { processedAt: new Date() } });
    return NextResponse.json({ received: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error processing Stripe webhook", err);
    // Returning 500 lets Stripe retry — processedAt was never set, so the
    // retry will attempt this handler again rather than silently dropping it.
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
