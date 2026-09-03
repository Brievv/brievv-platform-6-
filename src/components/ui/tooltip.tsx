"use client";

import { useState, useId, cloneElement } from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight CSS-only-positioned tooltip (no floating-ui dependency —
 * fine for the short, static labels this app uses it for). Shows on
 * hover and keyboard focus alike for accessibility.
 */
export function Tooltip({
  label,
  children,
  side = "top",
}: {
  label: string;
  children: React.ReactElement;
  side?: "top" | "bottom";
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {cloneElement(children, { "aria-describedby": id } as any)}
      {visible && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2.5 py-1.5 font-mono text-[0.68rem] text-white shadow-elevated",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2"
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
