"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FolderKanban,
  FileText,
  Building2,
  Users,
  Shuffle,
  ListChecks,
  CreditCard,
  Receipt,
  Files,
  MessageSquare,
  LifeBuoy,
  BarChart3,
  SlidersHorizontal,
  Wrench,
  UserCog,
  Shield,
  Settings,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

const NAV_GROUPS = [
  {
    label: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutGrid },
      { href: "/admin/projects", label: "Projects", icon: FolderKanban },
      { href: "/admin/quotes", label: "Quotes", icon: FileText },
      { href: "/admin/matching", label: "Matching", icon: Shuffle },
      { href: "/admin/tasks", label: "Tasks", icon: ListChecks },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/clients", label: "Clients", icon: Building2 },
      { href: "/admin/professionals", label: "Professionals", icon: Users },
      { href: "/admin/users", label: "Users", icon: UserCog },
      { href: "/admin/roles", label: "Roles", icon: Shield },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/invoices", label: "Invoices", icon: Receipt },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/files", label: "Files", icon: Files },
      { href: "/admin/messages", label: "Messages", icon: MessageSquare },
      { href: "/admin/support", label: "Support", icon: LifeBuoy },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/admin/pricing-rules", label: "Pricing Rules", icon: SlidersHorizontal },
      { href: "/admin/services", label: "Services", icon: Wrench },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 flex-none overflow-y-auto border-r border-border-dark bg-navy-deep text-paper lg:flex lg:flex-col">
      <div className="flex h-16 flex-none items-center border-b border-border-dark px-6">
        <Logo variant="dark" size="sm" />
        <span className="mono-label ml-3 text-paper/40">OPS</span>
      </div>

      <nav className="flex-1 space-y-5 p-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="mono-label px-3 text-paper/35">{group.label}</div>
            <div className="mt-1.5 space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors",
                      active ? "bg-orange text-white" : "text-paper/65 hover:bg-paper/[0.06] hover:text-paper"
                    )}
                  >
                    <item.icon size={16} strokeWidth={1.75} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
