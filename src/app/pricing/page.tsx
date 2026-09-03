import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

export default function PricingPage() {
  return (
    <MarketingPageShell
      eyebrow="§ PRICING"
      title="Project-based pricing, scoped to the work."
      intro="BRIEVV doesn't charge a subscription to submit a project. You get a scoped quote for the actual work, reviewed before anything is billed."
    >
      <ul className="list-inside list-disc space-y-2">
        <li>A deposit starts the engagement — the remaining balance follows your quote's milestone schedule</li>
        <li>Rush delivery carries a documented urgency multiplier, shown in your quote breakdown</li>
        <li>Work outside the original scope is handled through a change order, priced and approved before it begins</li>
        <li>Enterprise accounts can arrange custom billing — see the Enterprise page</li>
      </ul>
      <div className="flex flex-wrap gap-3 pt-2">
        <Link href="/start" className={buttonVariants({})}>
          Get a Quote
        </Link>
        <Link href="/enterprise" className={buttonVariants({ variant: "outline" })}>
          Enterprise pricing
        </Link>
      </div>
    </MarketingPageShell>
  );
}
