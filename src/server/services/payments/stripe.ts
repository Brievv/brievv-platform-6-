import Stripe from "stripe";
import { env, isStripeConfigured } from "@/lib/env";

/**
 * Stripe integration (spec §13, §33-34). Server-side only — the
 * publishable key is the only Stripe value ever sent to the browser
 * (via NEXT_PUBLIC_ equivalents you'd add if using Stripe Elements
 * client-side; this implementation uses Stripe Checkout instead, which
 * needs no client-side Stripe.js secret handling at all).
 *
 * Raw card data is never handled by this application — Stripe Checkout
 * hosts the payment form itself.
 */
export class StripeNotConfiguredError extends Error {
  constructor() {
    super("Stripe is not configured. Set STRIPE_SECRET_KEY (and STRIPE_WEBHOOK_SECRET for webhooks) in your environment.");
    this.name = "StripeNotConfiguredError";
  }
}

let _stripe: Stripe | null = null;
export function getStripeClient(): Stripe {
  if (!isStripeConfigured()) throw new StripeNotConfiguredError();
  if (_stripe) return _stripe;
  _stripe = new Stripe(env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
  return _stripe;
}

export interface CreateDepositCheckoutParams {
  projectId: string;
  quoteId: string;
  projectTitle: string;
  amountCents: number;
  currency?: string;
  clientEmail: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Creates a Stripe Checkout Session for a project deposit. Payment kind
 * ("DEPOSIT" vs "MILESTONE" vs "FULL") and the platform fee are recorded
 * on our own Payment row when the webhook confirms payment — Stripe
 * Checkout itself doesn't need to know about BRIEVV's internal fee model.
 */
export async function createDepositCheckoutSession(params: CreateDepositCheckoutParams): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.clientEmail,
    line_items: [
      {
        price_data: {
          currency: (params.currency ?? "usd").toLowerCase(),
          unit_amount: params.amountCents,
          product_data: {
            name: `BRIEVV project deposit — ${params.projectTitle}`,
            description: "Deposit to start your project. Remaining balance is billed per your quote's payment schedule.",
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      projectId: params.projectId,
      quoteId: params.quoteId,
      paymentKind: "DEPOSIT",
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url, sessionId: session.id };
}

export function verifyWebhookSignature(rawBody: string, signature: string): Stripe.Event {
  const stripe = getStripeClient();
  if (!env.STRIPE_WEBHOOK_SECRET) throw new StripeNotConfiguredError();
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}

export function calculatePlatformFeeCents(amountCents: number): number {
  return Math.round(amountCents * (env.STRIPE_PLATFORM_FEE_PERCENT / 100));
}
