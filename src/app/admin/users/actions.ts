"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";

const VALID_ROLES = [
  "SUPER_ADMIN",
  "OPERATIONS_ADMIN",
  "PROJECT_MANAGER",
  "FINANCE_ADMIN",
  "QUALITY_MANAGER",
  "PROFESSIONAL",
  "CLIENT",
  "SUPPORT_AGENT",
];

export async function changeUserRole(userId: string, newRole: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role;

  try {
    assertCan(actorRole, "users.manage");
  } catch {
    return { ok: false, error: "You don't have permission to change roles." };
  }

  if (!VALID_ROLES.includes(newRole)) return { ok: false, error: "Invalid role." };
  if (userId === actorId) return { ok: false, error: "You can't change your own role." };

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "User not found." };

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { role: newRole as any } }),
    db.auditLog.create({
      data: {
        actorId,
        action: "user.role_changed",
        entityType: "User",
        entityId: userId,
        metadata: { from: target.role, to: newRole },
      },
    }),
  ]);

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function toggleUserActive(userId: string, isActive: boolean): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role;

  try {
    assertCan(actorRole, "users.manage");
  } catch {
    return { ok: false, error: "You don't have permission to do that." };
  }
  if (userId === actorId) return { ok: false, error: "You can't deactivate your own account." };

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { isActive } }),
    db.auditLog.create({
      data: { actorId, action: isActive ? "user.reactivated" : "user.deactivated", entityType: "User", entityId: userId },
    }),
  ]);

  revalidatePath("/admin/users");
  return { ok: true };
}
