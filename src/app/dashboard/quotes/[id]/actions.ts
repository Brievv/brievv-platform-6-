"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyOps } from "@/server/services/notifications/notify";

const STAFF_ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "QUALITY_MANAGER"];

export async function approveQuoteInternally(quoteId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const reviewerId = (session?.user as any)?.id as string | undefined;
  if (!reviewerId || !role || !STAFF_ROLES.includes(role)) return { ok: false, error: "Team approval is required." };

  try {
    const quote = await db.quote.findUnique({ where: { id: quoteId }, include: { project: true } });
    if (!quote) return { ok: false, error: "Quote not found." };
    if (quote.status !== "PENDING_REVIEW") return { ok: false, error: "This quote is not awaiting team approval." };

    await db.$transaction([
      db.quote.update({ where: { id: quote.id }, data: { status: "READY", reviewedByUserId: reviewerId, reviewedAt: new Date() } }),
      db.project.update({
        where: { id: quote.projectId },
        data: { status: "QUOTE_READY", statusHistory: { create: { status: "QUOTE_READY", actorId: reviewerId, note: "Final team approval completed" } } },
      }),
      db.auditLog.create({ data: { actorId: reviewerId, action: "quote.approved.internal", entityType: "Quote", entityId: quote.id } }),
    ]);

    revalidatePath(`/dashboard/quotes/${quote.id}`);
    revalidatePath("/admin/quotes");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not approve this quote." };
  }
}

/**
 * Server actions backing the quote review/approval page. Each one
 * re-checks that the current user actually owns the project before
 * mutating anything — never trust that a client only ever navigates to
 * their own quote URLs (spec §72: "Clients should only access their own
 * projects... quotes").
 */

async function assertOwnsQuote(quoteId: string, userId: string) {
  const quote = await db.quote.findUnique({ where: { id: quoteId }, include: { project: true } });
  if (!quote) throw new Error("Quote not found");
  if (quote.project.createdByUserId !== userId) throw new Error("Forbidden");
  return quote;
}

export async function approveQuote(quoteId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;

  try {
    const quote = await assertOwnsQuote(quoteId, userId);
    if (quote.status === "EXPIRED") return { ok: false, error: "This quote has expired — request a new one." };

    await db.$transaction([
      db.quote.update({ where: { id: quote.id }, data: { status: "ACCEPTED" } }),
      db.project.update({
        where: { id: quote.projectId },
        data: {
          status: "QUOTE_ACCEPTED",
          statusHistory: { create: { status: "QUOTE_ACCEPTED", actorId: userId } },
        },
      }),
      db.auditLog.create({
        data: { actorId: userId, action: "quote.approved", entityType: "Quote", entityId: quote.id },
      }),
    ]);

    // NOTE: per spec §13, paid project execution shouldn't begin until
    // checkout completes — the natural next status after QUOTE_ACCEPTED is
    // PAYMENT_PENDING, set once the Stripe checkout flow (Phase 3) exists.
    // Wiring that transition here now would silently start work before
    // payment, which the spec explicitly prohibits — so it's left for the
    // checkout route to set once implemented.

    revalidatePath(`/dashboard/quotes/${quote.id}`);

    await notifyOps({
      type: "quote_approved",
      title: "Quote approved",
      body: `${quote.project.title} — client approved the quote.`,
      link: `/admin/quotes`,
    });

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not approve this quote." };
  }
}

export async function requestQuoteChanges(quoteId: string, reason: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;

  if (!reason.trim()) return { ok: false, error: "Tell BRIEVV what you'd like changed." };

  try {
    const quote = await assertOwnsQuote(quoteId, userId);

    await db.$transaction([
      db.quote.update({ where: { id: quote.id }, data: { status: "PENDING_REVIEW" } }),
      db.quoteRevision.create({
        data: { quoteId: quote.id, changedById: userId, diff: {}, reason },
      }),
      db.auditLog.create({
        data: { actorId: userId, action: "quote.change_requested", entityType: "Quote", entityId: quote.id, metadata: { reason } },
      }),
    ]);

    revalidatePath(`/dashboard/quotes/${quote.id}`);

    await notifyOps({
      type: "quote_change_requested",
      title: "Client requested quote changes",
      body: `${quote.project.title} — "${reason.slice(0, 100)}"`,
      link: `/admin/quotes`,
    });

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not submit your request." };
  }
}
