import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

export default function PlatformPage() {
  return (
    <MarketingPageShell
      eyebrow="§ PLATFORM"
      title="One intake. Every AEC discipline."
      intro="BRIEVV is the layer between a project brief and a working project team — estimation, matching, and delivery tracking in one place."
    >
      <p>
        A brief comes in once. BRIEVV's estimator classifies the work, a deterministic pricing engine sets the
        boundaries a client can be quoted, and — once approved — BRIEVV assembles a team from its network of
        verified AEC professionals.
      </p>
      <p>
        Every project gets a dedicated workspace: status timeline, files, quotes, payments, and messaging in one
        place, visible to the client and the assigned team.
      </p>
      <p>
        AI assists estimation and workflow. It does not replace the judgment of licensed, qualified professionals —
        regulated work always carries a mandatory human review step before a quote is finalized.
      </p>
    </MarketingPageShell>
  );
}
