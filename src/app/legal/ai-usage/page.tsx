import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

export default function AiUsagePage() {
  return (
    <MarketingPageShell eyebrow="§ LEGAL" title="AI Usage Policy">
      <p>
        BRIEVV uses AI to assist project estimation, document analysis, and professional matching. AI produces
        recommendations only — it does not set final pricing, does not approve professionals, and does not replace
        the judgment of licensed, qualified professionals on regulated work.
      </p>
      <p>
        Every AI-generated price estimate is bounded by a deterministic pricing rules engine configured by BRIEVV's
        operations team, and every quote above a configured complexity or value threshold requires human review
        before it's sent to a client.
      </p>
      <p>
        If an AI service is unavailable, your submitted brief is never lost — it's saved immediately and queued for
        manual review by BRIEVV's team.
      </p>
    </MarketingPageShell>
  );
}
