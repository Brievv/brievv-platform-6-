"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";

async function requirePricingPermission() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Sign in required.");
  const role = (session.user as any).role;
  assertCan(role, "pricing.configure");
  return session;
}

export async function createPricingRule(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requirePricingPermission();
    const userId = (session.user as any).id as string;

    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { ok: false, error: "Name is required." };
    const disciplineSlug = String(formData.get("disciplineSlug") ?? "").trim() || null;
    const basePrice = parseFloat(String(formData.get("basePrice") ?? "0"));
    const margin = parseFloat(String(formData.get("margin") ?? "20"));

    await db.pricingRule.create({
      data: {
        name,
        disciplineSlug,
        basePriceCents: Math.round(basePrice * 100),
        complexityMultiplier: { simple: 1.0, medium: 1.6, large: 2.8 },
        urgencyMultiplier: { standard: 1.0, rush: 1.25, asap: 1.5 },
        platformMarginPercent: margin,
        updatedByUserId: userId,
      },
    });

    revalidatePath("/admin/pricing-rules");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not create rule." };
  }
}

export async function toggleRuleActive(ruleId: string, isActive: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    await requirePricingPermission();
    await db.pricingRule.update({ where: { id: ruleId }, data: { isActive } });
    revalidatePath("/admin/pricing-rules");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Could not update rule." };
  }
}
