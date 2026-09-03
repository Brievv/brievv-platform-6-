"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Sign in required.");
  const role = (session.user as any).role;
  assertCan(role, "pricing.configure"); // reuse the ops-configuration permission tier
  return session;
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Creates a new discipline the platform supports. Per spec §1: "The
 * platform must be designed so additional disciplines can be added from
 * the admin panel without changing the core application." The matching
 * engine, service catalog, and quote data model already read disciplines
 * from this table rather than a hardcoded enum. The one exception today
 * is the /start intake wizard's discipline chip list, which is still a
 * static array in that client component — migrating it to fetch from
 * this table is tracked in docs/ROADMAP.md rather than silently assumed done.
 */
export async function createDiscipline(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { ok: false, error: "Name is required." };
    const description = String(formData.get("description") ?? "").trim();

    await db.discipline.create({ data: { name, slug: slugify(name), description: description || null } });
    revalidatePath("/admin/services");
    return { ok: true };
  } catch (err: any) {
    if (err.code === "P2002") return { ok: false, error: "A discipline with that name already exists." };
    return { ok: false, error: err.message ?? "Could not create discipline." };
  }
}

export async function toggleDisciplineActive(id: string, isActive: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await db.discipline.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/services");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not update discipline." };
  }
}
