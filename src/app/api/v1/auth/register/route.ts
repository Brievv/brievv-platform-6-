import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  password: z.string().min(8),
});

/**
 * POST /api/v1/auth/register
 * Public account creation for clients. Professional applications go
 * through a separate flow (features/professionals) since they require
 * verification before activation (spec §21).
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }
  const { name, email, company, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash,
      role: "CLIENT",
      clientProfile: company ? { create: { companyName: company } } : undefined,
    },
  });

  await db.auditLog.create({
    data: { actorId: user.id, action: "user.registered", entityType: "User", entityId: user.id },
  });

  // TODO(email): send verification email via Resend once RESEND_API_KEY
  // is configured — see src/server/services/email (Phase 3).

  return NextResponse.json({ ok: true, userId: user.id });
}
