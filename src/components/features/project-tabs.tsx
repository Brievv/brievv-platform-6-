"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/projects/${projectId}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/tasks`, label: "Tasks" },
    { href: `${base}/milestones`, label: "Milestones" },
    { href: `${base}/deliverables`, label: "Deliverables" },
    { href: `${base}/team`, label: "Team" },
    { href: `${base}/issues`, label: "Issues" },
    { href: `${base}/approvals`, label: "Approvals" },
    { href: `${base}/messages`, label: "Messages" },
    { href: `${base}/activity`, label: "Activity" },
  ];

  return (
    <div className="border-b border-ink/10 bg-paper/60 px-6">
      <nav className="mx-auto flex max-w-4xl gap-6 overflow-x-auto">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "border-b-2 py-3 text-sm transition-colors",
                active ? "border-orange font-medium text-ink" : "border-transparent text-steel hover:text-ink"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
