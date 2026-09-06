import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ProSidebar } from "@/components/layout/pro-shell";
import { CommandPalette } from "@/components/features/command-palette";

const ALLOWED_ROLES = ["PROFESSIONAL", "SUPER_ADMIN", "OPERATIONS_ADMIN"];

export const dynamic = "force-dynamic";

export default async function ProLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;

  // Defense in depth alongside middleware.ts (see comment there on why
  // both layers exist).
  if (!session?.user || !role || !ALLOWED_ROLES.includes(role)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <ProSidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      <CommandPalette />
    </div>
  );
}
