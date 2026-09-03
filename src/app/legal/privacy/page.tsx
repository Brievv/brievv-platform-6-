import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

export default function PrivacyPage() {
  return (
    <MarketingPageShell eyebrow="§ LEGAL" title="Privacy Policy">
      <p>
        BRIEVV collects the information needed to operate the platform: account details, project briefs, uploaded
        files, messages, and payment records. Organizations only ever access their own data — tenant isolation is
        enforced at the database query level, not only in the interface.
      </p>
      <p>
        Files are stored in object storage and served only via short-lived signed URLs. Professional verification
        documents are private and are never displayed publicly.
      </p>
      <p>
        BRIEVV uses a third-party AI provider to assist estimation and document analysis. Project details are sent
        to that provider solely to generate a recommendation; the provider is not authorized to use that data to
        train models on BRIEVV's behalf.
      </p>
      <p>
        This is placeholder legal content for a development build. Replace with counsel-reviewed Privacy Policy
        before processing real client or professional data.
      </p>
    </MarketingPageShell>
  );
}
