"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/services", label: "Services" },
  { href: "/for-businesses", label: "For Businesses" },
  { href: "/for-professionals", label: "For Professionals" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="glass-nav sticky top-0 z-50 border-b border-ink/10">
      <div className="container-brievv flex h-18 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-7 xl:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-ink/75 transition-colors hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/sign-in" className="text-sm font-medium text-ink/75 hover:text-ink">
            Sign In
          </Link>
          <Link href="/how-it-works" className={buttonVariants({ variant: "outline", size: "md" })}>
            Explore the Platform
          </Link>
          <Link href="/start" className={buttonVariants({ size: "md" })}>
            Start a Project
          </Link>
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="glass-nav border-t border-ink/10 lg:hidden">
          <nav className="container-brievv flex flex-col gap-1 py-4">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="rounded px-2 py-2.5 text-sm text-ink/80 hover:bg-ink/[0.04]" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-ink/10 pt-4">
              <Link href="/sign-in" className="rounded px-2 py-2.5 text-sm font-medium">
                Sign In
              </Link>
              <Link href="/how-it-works" className={buttonVariants({ variant: "outline" })}>
                Explore the Platform
              </Link>
              <Link href="/start" className={buttonVariants({})}>
                Start a Project
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
