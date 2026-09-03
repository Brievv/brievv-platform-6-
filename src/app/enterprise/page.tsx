import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

export default function EnterprisePage() {
  return (
    <MarketingPageShell
      eyebrow="§ ENTERPRISE"
      title="Volume projects, dedicated account management, custom terms."
      intro="For organizations running recurring AEC work at scale — portfolios, developers, and firms with ongoing project pipelines."
    >
      <ul className="list-inside list-disc space-y-2">
        <li>Volume project pricing and dedicated account management</li>
        <li>Custom SLAs and procurement workflows</li>
        <li>Team accounts with role-based access across your organization</li>
        <li>Custom security and compliance requirements</li>
        <li>Custom billing and API integrations</li>
      </ul>
      <Link href="/contact" className={buttonVariants({ className: "mt-4" })}>
        Talk to Enterprise Sales
      </Link>
    </MarketingPageShell>
  );
}
