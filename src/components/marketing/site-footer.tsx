import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Platform",
    links: [
      { href: "/start", label: "Start a Project" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/services", label: "Services" },
      { href: "/track", label: "Track a project" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/case-studies", label: "Case Studies" },
      { href: "/enterprise", label: "Enterprise" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Professionals",
    links: [
      { href: "/for-professionals", label: "Join the network" },
      { href: "/for-professionals/verification", label: "Verification" },
      { href: "/resources", label: "Resources" },
    ],
  },
  {
    title: "Trust & Legal",
    links: [
      { href: "/trust", label: "Trust Center" },
      { href: "/api-docs", label: "API Reference" },
      { href: "/legal/terms", label: "Terms of Service" },
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/ai-usage", label: "AI Usage Policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="glass-surface-dark mx-3 mb-3 rounded-xl text-paper sm:mx-6 sm:mb-6">
      <div className="container-brievv py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo variant="dark" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-paper/60">
              AI handles estimation, matching, scheduling, and workflow. Professionals handle the work.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="mono-label text-paper/40">{col.title}</div>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-paper/70 transition-colors hover:text-paper">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border-dark pt-8 text-xs text-paper/45 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} BRIEVV, Inc. All rights reserved.</span>
          <span className="font-mono">SYS · OPERATIONAL</span>
        </div>
      </div>
    </footer>
  );
}
