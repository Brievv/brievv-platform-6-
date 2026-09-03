import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded bg-[linear-gradient(90deg,theme(colors.ink/6),theme(colors.ink/10),theme(colors.ink/6))] bg-[length:1000px_100%]",
        className
      )}
    />
  );
}
