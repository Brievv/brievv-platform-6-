import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

export default function AboutPage() {
  return (
    <MarketingPageShell
      eyebrow="§ ABOUT"
      title="Built for how AEC project delivery actually works."
      intro="BRIEVV exists to remove the friction between a project brief and a working team — without cutting the human review that regulated design work requires."
    >
      <p>
        Most AEC work moves slowly not because the work itself is slow, but because scoping, pricing, and staffing a
        project usually takes days of back-and-forth before anyone touches a drawing. BRIEVV compresses that into an
        intake, an AI-assisted estimate reviewed against deterministic pricing rules, and a matched team — while
        keeping qualified professionals responsible for the professional work itself.
      </p>
      <p>
        We're building BRIEVV as infrastructure: governed AI, tenant-isolated data, audited actions, and a
        verification workflow for every professional in the network.
      </p>
    </MarketingPageShell>
  );
}
