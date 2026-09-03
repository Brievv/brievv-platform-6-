"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function updateProfessionalProfile(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const userId = (session.user as any).id as string;

  const profile = await db.professionalProfile.findUnique({ where: { userId } });
  if (!profile) return { ok: false, error: "No profile found." };

  const title = String(formData.get("title") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const yearsExperience = Number(formData.get("yearsExperience") ?? 0);
  const hourlyRate = formData.get("hourlyRate") ? Number(formData.get("hourlyRate")) : null;
  const portfolioUrl = String(formData.get("portfolioUrl") ?? "").trim();
  const jurisdictions = String(formData.get("jurisdictions") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const softwareSkills = String(formData.get("softwareSkills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const timezone = String(formData.get("timezone") ?? "").trim();

  await db.professionalProfile.update({
    where: { id: profile.id },
    data: {
      title: title || null,
      bio: bio || null,
      yearsExperience,
      hourlyRateCents: hourlyRate ? Math.round(hourlyRate * 100) : null,
      portfolioUrl: portfolioUrl || null,
      jurisdictions,
      softwareSkills,
      timezone: timezone || null,
    },
  });

  revalidatePath("/pro/profile");
  return { ok: true };
}
