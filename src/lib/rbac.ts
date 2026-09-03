import type { UserRole } from "@prisma/client";

/**
 * Server-side RBAC (spec §24-25).
 *
 * Every permission check in this file must be re-run on the server for
 * every protected mutation/query — never trust a role read from the
 * client, and never rely on hiding a button as the only protection.
 * UI components use `can()` too, but purely to decide what to render;
 * the actual API routes / server actions call `assertCan()` again.
 */

export type Permission =
  | "project.view.own"
  | "project.view.all"
  | "project.status.update"
  | "quote.generate"
  | "quote.review"
  | "quote.approve.internal"
  | "professional.verify"
  | "professional.suspend"
  | "matching.run"
  | "matching.override"
  | "payment.view"
  | "payment.refund"
  | "pricing.configure"
  | "ai.configure"
  | "users.manage"
  | "audit.view";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "project.view.all",
    "project.status.update",
    "quote.generate",
    "quote.review",
    "quote.approve.internal",
    "professional.verify",
    "professional.suspend",
    "matching.run",
    "matching.override",
    "payment.view",
    "payment.refund",
    "pricing.configure",
    "ai.configure",
    "users.manage",
    "audit.view",
  ],
  OPERATIONS_ADMIN: [
    "project.view.all",
    "project.status.update",
    "quote.generate",
    "quote.review",
    "quote.approve.internal",
    "professional.verify",
    "matching.run",
    "matching.override",
    "payment.view",
    "audit.view",
  ],
  PROJECT_MANAGER: ["project.view.all", "project.status.update", "quote.review", "matching.run", "audit.view"],
  FINANCE_ADMIN: ["payment.view", "payment.refund", "project.view.all", "audit.view"],
  QUALITY_MANAGER: ["project.view.all", "project.status.update", "audit.view"],
  PROFESSIONAL: ["project.view.own"],
  CLIENT: ["project.view.own"],
  SUPPORT_AGENT: ["project.view.all", "audit.view"],
};

export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export class ForbiddenError extends Error {
  constructor(permission: Permission) {
    super(`Forbidden: role lacks permission "${permission}"`);
    this.name = "ForbiddenError";
  }
}

/** Throws if the role doesn't have the permission — call this at the top of every protected server action / API handler. */
export function assertCan(role: UserRole, permission: Permission): void {
  if (!can(role, permission)) {
    throw new ForbiddenError(permission);
  }
}
