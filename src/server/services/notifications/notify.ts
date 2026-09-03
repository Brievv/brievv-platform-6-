import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/env";

/**
 * Central notification helper. Every server action that should trigger a
 * notification (spec §28's list: quote ready, payment received, task
 * assigned, deliverable ready, message received, status changes,
 * professional application changes, etc.) calls this instead of writing
 * to the Notification table directly — so channel routing and the
 * email-fallback behavior live in one place.
 *
 * IN_APP notifications always write to the database (that's what powers
 * the notification bell). Email delivery is attempted only when
 * RESEND_API_KEY is configured; otherwise this silently no-ops the email
 * leg rather than throwing — a missing email credential should never
 * break the action that triggered the notification (same "don't lose
 * the user's work over an unconfigured integration" principle as the AI
 * estimator's fallback).
 */
export interface NotifyInput {
  userId: string;
  type: string; // e.g. "quote_ready", "payment_received", "task_assigned"
  title: string;
  body: string;
  link?: string;
}

export async function notify(input: NotifyInput): Promise<void> {
  await db.notification.create({
    data: {
      userId: input.userId,
      channel: "IN_APP",
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    },
  });

  if (isEmailConfigured()) {
    // TODO: send via Resend once a transactional email template exists
    // for this notification `type` (spec §40's template list). Wiring
    // this in means: emails/<type>.tsx (React Email component) + a call
    // to the Resend SDK here. Intentionally not stubbed further than
    // this comment — a fake "email sent" log would be more misleading
    // than an honest gap.
  }
}

/** Convenience for notifying every member of a project's organization (e.g. all staff on a client's team). */
export async function notifyOrganization(organizationId: string, input: Omit<NotifyInput, "userId">): Promise<void> {
  const members = await db.organizationMember.findMany({ where: { organizationId }, select: { userId: true } });
  await Promise.all(members.map((m: any) => notify({ ...input, userId: m.userId })));
}

/** Notifies BRIEVV's internal ops team (small-team assumption: every OPERATIONS_ADMIN/SUPER_ADMIN gets it, rather than a per-project owner assignment that doesn't exist yet). */
export async function notifyOps(input: Omit<NotifyInput, "userId">): Promise<void> {
  const staff = await db.user.findMany({ where: { role: { in: ["OPERATIONS_ADMIN", "SUPER_ADMIN"] }, isActive: true }, select: { id: true } });
  await Promise.all(staff.map((s: any) => notify({ ...input, userId: s.id })));
}
