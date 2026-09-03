"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, UserCog, ClipboardCheck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

const NAV = [
  { href: "/pro", label: "Overview", icon: LayoutGrid },
  { href: "/pro/assignments", label: "Assignments", icon: ClipboardCheck },
  { href: "/pro/profile", label: "Profile", icon: UserCog },
  { href: "/pro/verification", label: "Verification", icon: ShieldCheck },
];

export function ProSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 flex-none border-r border-ink/10 bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-ink/10 px-6">
        <Logo size="sm" />
        <span className="mono-label ml-3 text-steel/60">PRO</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors",
                active ? "bg-orange text-white" : "text-ink/70 hover:bg-ink/[0.04] hover:text-ink"
              )}
            >
              <item.icon size={16} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
