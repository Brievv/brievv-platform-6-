import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

export default function TermsPage() {
  return (
    <MarketingPageShell eyebrow="§ LEGAL" title="Terms of Service">
      <p>
        These Terms govern use of the BRIEVV platform. By creating an account or submitting a project brief, you
        agree to these Terms.
      </p>
      <p>
        BRIEVV connects clients with independent AEC professionals and provides AI-assisted estimation, matching,
        and project workflow tools. BRIEVV is not itself a licensed architecture or engineering firm; professional
        services are performed by independent, qualified professionals responsible for their own work product and
        applicable licensing.
      </p>
      <p>
        Quotes generated through the platform are estimates reviewed by BRIEVV's team before work begins. Final
        scope, pricing, and timelines are confirmed in writing prior to project start.
      </p>
      <p>
        This is placeholder legal content for a development build. Replace with counsel-reviewed Terms of Service
        before accepting real client agreements.
      </p>
    </MarketingPageShell>
  );
}
