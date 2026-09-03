"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();

  if (!name) return { ok: false, error: "Name can't be empty." };

  await db.user.update({
    where: { id: userId },
    data: { name, phone: phone || null, timezone: timezone || "UTC" },
  });

  revalidatePath("/dashboard/settings");
  return { ok: true };
}
