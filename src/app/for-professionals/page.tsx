import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

export default function ForProfessionalsPage() {
  return (
    <MarketingPageShell
      eyebrow="§ FOR PROFESSIONALS"
      title="Join the BRIEVV network."
      intro="BRIEVV works with vetted independent architects, engineers, and drafters. Every project match runs through a verification workflow — not an open bidding board."
    >
      <ul className="list-inside list-disc space-y-2">
        <li>Set your disciplines, software skills, jurisdictions, and rates</li>
        <li>Get matched to projects that fit your experience and availability</li>
        <li>BRIEVV handles client relationships, contracts, and payment</li>
        <li>Build a track record — completed projects and client reviews on your profile</li>
      </ul>
      <div className="flex flex-wrap gap-3 pt-2">
        <Link href="/apply" className={buttonVariants({})}>
          Apply to join
        </Link>
        <Link href="/for-professionals/verification" className={buttonVariants({ variant: "outline" })}>
          How verification works
        </Link>
      </div>
    </MarketingPageShell>
  );
}
