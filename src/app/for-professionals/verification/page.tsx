import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

const STAGES = [
  { name: "Application", body: "You submit disciplines, experience, portfolio, and licensing information." },
  { name: "Under Review", body: "BRIEVV's ops team reviews your credentials and portfolio." },
  { name: "Documents Required", body: "If licensing or certification documents are missing, we'll ask for them here." },
  { name: "Verified", body: "You're eligible for project matching in your verified disciplines." },
  { name: "Active", body: "You're visible to the matching engine and can accept project assignments." },
];

export default function VerificationPage() {
  return (
    <MarketingPageShell
      eyebrow="§ VERIFICATION"
      title="How professional verification works."
      intro="BRIEVV never matches professionals to regulated work without verified licensing — this is enforced in the matching engine itself, not just a policy."
    >
      <ol className="space-y-4">
        {STAGES.map((s, i) => (
          <li key={s.name} className="flex gap-4">
            <span className="mono-label flex-none text-orange">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div className="font-medium text-ink">{s.name}</div>
              <p className="mt-1 text-steel">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="pt-2 text-xs text-steel">
        Verification documents are private and are never displayed publicly on a professional's profile.
      </p>
    </MarketingPageShell>
  );
}
