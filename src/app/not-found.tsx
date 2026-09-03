import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <Logo href="/" />
      <div className="mono-label mt-10 text-steel">ERROR · 404</div>
      <h1 className="mt-3 font-display text-3xl font-medium text-ink">Page not found.</h1>
      <p className="mt-3 max-w-sm text-sm text-steel">
        The page you're looking for doesn't exist, moved, or the link is out of date.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-8" })}>
        Back to BRIEVV
      </Link>
    </div>
  );
}
