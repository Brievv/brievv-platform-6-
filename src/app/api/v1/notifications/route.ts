import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const userId = (session.user as any).id as string;

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.notification.count({ where: { userId, readAt: null } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const userId = (session.user as any).id as string;

  const body = await req.json().catch(() => ({}));
  const { notificationId, markAll } = body as { notificationId?: string; markAll?: boolean };

  if (markAll) {
    await db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  if (notificationId) {
    // Scope the update to this user's own notification — never let one
    // user mark another user's notification read via a guessed ID.
    await db.notification.updateMany({ where: { id: notificationId, userId }, data: { readAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Provide notificationId or markAll." }, { status: 422 });
}
