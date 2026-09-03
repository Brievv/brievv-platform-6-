"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function updateTicketStatus(ticketId: string, status: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, error: "Sign in required." };

  await db.supportTicket.update({ where: { id: ticketId }, data: { status } });
  revalidatePath("/admin/support");
  return { ok: true };
}
