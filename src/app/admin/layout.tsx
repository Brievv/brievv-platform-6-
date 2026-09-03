import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/admin-shell";
import { CommandPalette } from "@/components/features/command-palette";

const ADMIN_ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER", "SUPPORT_AGENT"];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;

  // Defense in depth: middleware already redirects non-admin roles away
  // from /admin, but this layout re-checks server-side on every render
  // since middleware can, in principle, be bypassed or misconfigured.
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      <CommandPalette />
    </div>
  );
}
