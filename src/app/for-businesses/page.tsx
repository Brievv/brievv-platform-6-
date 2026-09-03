import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

export default function ForBusinessesPage() {
  return (
    <MarketingPageShell
      eyebrow="§ FOR BUSINESSES"
      title="Submit the work. BRIEVV assembles the team."
      intro="Whether it's a single drafting task or a multidisciplinary build-out, BRIEVV scopes, prices, and staffs it from one intake."
    >
      <p>
        Get a scoped price range and timeline in minutes, reviewed by BRIEVV before any work begins. Track everything
        — files, messages, milestones — from one project workspace.
      </p>
      <Link href="/start" className={buttonVariants({ className: "mt-4" })}>
        Start a Project
      </Link>
    </MarketingPageShell>
  );
}
