"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { getStripeClient, StripeNotConfiguredError } from "@/server/services/payments/stripe";

export async function refundPayment(paymentId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const actorId = (session.user as any).id as string;
  const role = (session.user as any).role;

  try {
    assertCan(role, "payment.refund");
  } catch {
    return { ok: false, error: "You don't have permission to issue refunds." };
  }

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { ok: false, error: "Payment not found." };
  if (payment.status !== "PAID") return { ok: false, error: "Only paid payments can be refunded." };
  if (!payment.stripePaymentIntentId) return { ok: false, error: "No Stripe payment intent on record for this payment." };

  try {
    const stripe = getStripeClient();
    await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
    // Actual status flip to REFUNDED happens via the charge.refunded webhook
    // (src/app/api/webhooks/stripe/route.ts) once Stripe confirms it —
    // this route only ever *requests* the refund, matching the same
    // "webhook is the source of truth" pattern used for the original charge.

    await db.auditLog.create({
      data: { actorId, action: "payment.refund_requested", entityType: "Payment", entityId: paymentId },
    });

    revalidatePath("/admin/payments");
    return { ok: true };
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return { ok: false, error: "Stripe isn't configured in this environment." };
    }
    // eslint-disable-next-line no-console
    console.error("Refund failed", err);
    return { ok: false, error: "Refund request failed." };
  }
}
