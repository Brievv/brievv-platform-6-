"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  category: z.enum(["start_project", "sales", "enterprise", "professional", "support", "general"]),
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(5),
});

export async function submitContactRequest(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const parsed = schema.safeParse({
    category: formData.get("category"),
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { ok: false, error: "Please fill in every field." };

  const session = await getServerSession(authOptions);

  await db.supportTicket.create({
    data: {
      userId: session?.user ? (session.user as any).id : null,
      category: parsed.data.category,
      subject: `${parsed.data.category.replace(/_/g, " ")} inquiry from ${parsed.data.name}`,
      message: `${parsed.data.message}\n\n— ${parsed.data.name} <${parsed.data.email}>`,
    },
  });

  return { ok: true };
}
