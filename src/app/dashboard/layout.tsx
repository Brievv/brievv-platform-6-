import { DashboardSidebar } from "@/components/layout/dashboard-shell";
import { CommandPalette } from "@/components/features/command-palette";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      <CommandPalette />
    </div>
  );
}
