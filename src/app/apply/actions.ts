"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  disciplines: z.array(z.string()).min(1),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  hourlyRate: z.coerce.number().min(0).optional(),
  jurisdictions: z.string().optional(),
  softwareSkills: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  bio: z.string().optional(),
});

function slugifyList(raw?: string): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function submitProfessionalApplication(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse({ ...raw, disciplines: formData.getAll("disciplines") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  const existing = await db.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) return { ok: false, error: "An account with that email already exists — sign in instead." };

  const passwordHash = await bcrypt.hash(data.password, 12);

  const disciplineRows = await Promise.all(
    data.disciplines.map((name) =>
      db.discipline.upsert({
        where: { name },
        update: {},
        create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      })
    )
  );

  const user = await db.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash,
      role: "PROFESSIONAL",
      professionalProfile: {
        create: {
          title: data.disciplines[0],
          bio: data.bio || null,
          yearsExperience: data.yearsExperience,
          softwareSkills: slugifyList(data.softwareSkills),
          jurisdictions: slugifyList(data.jurisdictions),
          portfolioUrl: data.portfolioUrl || null,
          hourlyRateCents: data.hourlyRate ? Math.round(data.hourlyRate * 100) : null,
          licenseNumber: data.licenseNumber || null,
          licenseState: data.licenseState || null,
          status: "APPLIED",
          disciplines: { create: disciplineRows.map((d) => ({ disciplineId: d.id })) },
        },
      },
    },
  });

  await db.auditLog.create({
    data: { actorId: user.id, action: "professional.applied", entityType: "User", entityId: user.id },
  });

  return { ok: true };
}
