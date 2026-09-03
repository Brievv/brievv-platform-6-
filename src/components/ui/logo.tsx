import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * BRIEVV wordmark. Always renders the uploaded brand asset (never
 * text recreated in CSS) — see /public/brand for the generated
 * light/dark/mark variants (spec §2, §92).
 */
export function Logo({
  variant = "light",
  size = "md",
  mark = false,
  href = "/",
  className,
}: {
  /** "light" = dark ink logo for light backgrounds. "dark" = white logo for navy/dark backgrounds. */
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  /** Compact mark only (no wordmark tail) — for tight spaces like a mobile nav or favicon-adjacent UI. */
  mark?: boolean;
  href?: string | null;
  className?: string;
}) {
  const heights = { sm: 22, md: 28, lg: 36 };
  const height = heights[size];

  const src = mark
    ? variant === "dark"
      ? "/brand/brievv-mark-white.png"
      : "/brand/brievv-mark.png"
    : variant === "dark"
    ? "/brand/brievv-logo-white.png"
    : "/brand/brievv-logo.png";

  // Original asset aspect ratio ~419x133 (wordmark) or ~139x133 (mark)
  const aspect = mark ? 139 / 133 : 419 / 133;
  const width = Math.round(height * aspect);

  const img = (
    <Image
      src={src}
      alt="BRIEVV"
      width={width}
      height={height}
      priority
      className={cn("select-none", className)}
    />
  );

  if (!href) return img;
  return (
    <Link href={href} aria-label="BRIEVV home" className="inline-flex items-center">
      {img}
    </Link>
  );
}
