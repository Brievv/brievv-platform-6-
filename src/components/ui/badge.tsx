import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wide whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-ink/[0.04] border-transparent text-steel",
        info: "bg-[#EAF1FB] border-transparent text-[#2158A8]",
        success: "bg-[#E9F7EF] border-transparent text-success",
        warning: "bg-[#FEF6E7] border-transparent text-warning",
        danger: "bg-[#FCEBEB] border-transparent text-danger",
        dark: "bg-ink text-white border-transparent",
        outline: "border-ink/15 text-ink bg-transparent",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export function Badge({ className, tone, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
