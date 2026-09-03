"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FolderKanban,
  FileText,
  MessageSquare,
  Files,
  Receipt,
  CreditCard,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button";
import { NotificationBell } from "@/components/features/notification-bell";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/quotes", label: "Quotes", icon: FileText },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/files", label: "Files", icon: Files },
  { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/team", label: "Team", icon: Users },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-none border-r border-ink/10 bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-ink/10 px-6">
        <Logo size="sm" />
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors",
                active ? "bg-ink text-white" : "text-ink/70 hover:bg-ink/[0.05] hover:text-ink"
              )}
            >
              <item.icon size={17} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink/10 p-3">
        <Link href="/dashboard/settings" className="flex items-center gap-3 rounded px-3 py-2.5 text-sm text-ink/70 hover:bg-ink/[0.05] hover:text-ink">
          <Settings size={17} strokeWidth={1.75} />
          Settings
        </Link>
      </div>
    </aside>
  );
}

export function DashboardTopbar({ title }: { title: string }) {
  return (
    <header className="flex h-16 flex-none items-center justify-between border-b border-ink/10 bg-paper px-6">
      <h1 className="font-display text-lg font-medium text-ink">{title}</h1>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <Link href="/start" className={buttonVariants({ size: "sm" })}>
          Start New Project
        </Link>
      </div>
    </header>
  );
}
