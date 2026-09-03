"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Structured server-side logging happens where the error originated;
    // this client-side log is for local dev visibility only and never
    // includes secrets, payment credentials, or private file contents.
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error", { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <Logo href="/" />
      <div className="mono-label mt-10 text-danger">ERROR · 500</div>
      <h1 className="mt-3 font-display text-3xl font-medium text-ink">Something went wrong.</h1>
      <p className="mt-3 max-w-sm text-sm text-steel">
        Our team has been notified. Your work — if you were mid-brief or mid-upload — has not been lost; refresh and
        pick up where you left off.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-steel/60">Reference: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Link href="/contact" className={buttonVariants({ variant: "outline" })}>
          Contact support
        </Link>
      </div>
    </div>
  );
}
