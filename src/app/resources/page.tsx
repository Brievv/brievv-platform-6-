import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

export default function ResourcesPage() {
  return (
    <MarketingPageShell
      eyebrow="§ RESOURCES"
      title="Guides and templates for AEC project delivery."
      intro="This hub is being built out — articles, project templates, and industry guides will appear here as they're published."
    >
      <p>
        In the meantime, the fastest way to understand how a specific project would be scoped is to submit a brief —
        BRIEVV's estimator will return a concrete price range and timeline against your actual requirements.
      </p>
    </MarketingPageShell>
  );
}
