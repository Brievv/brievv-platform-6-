import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { UsersList, type UserRow } from "./users-list";
import { NotificationBell } from "@/components/features/notification-bell";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const currentUserId = (session.user as any).id as string;

  const users = await db.user.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const rows: UserRow[] = users.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <>
      <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
        <h1 className="font-display text-lg font-medium text-ink">Users</h1>
      <NotificationBell />
      </header>
      <main className="flex-1 p-6 lg:p-8">
        <UsersList initial={rows} currentUserId={currentUserId} />
      </main>
    </>
  );
}
