import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

const STEPS = [
  { n: "01", title: "Submit the brief", body: "Tell BRIEVV what you need — disciplines, scope, timeline, jurisdiction — and attach any existing materials." },
  { n: "02", title: "Get an intelligent quote", body: "BRIEVV's estimator classifies the work and returns a scoped price range, timeline, and recommended team, usually within minutes." },
  { n: "03", title: "Approve the quote", body: "Review the full scope, assumptions, and exclusions. Request changes if something's off, or approve to move forward." },
  { n: "04", title: "Pay the deposit", body: "A deposit starts the engagement. BRIEVV never begins paid work before payment is confirmed." },
  { n: "05", title: "BRIEVV assembles the team", body: "Verified professionals matching your disciplines, jurisdiction, and timeline are assigned to your project." },
  { n: "06", title: "Track delivery", body: "Follow status, files, and messages in your project workspace until final QA and delivery." },
];

export default function HowItWorksPage() {
  return (
    <MarketingPageShell
      eyebrow="§ HOW IT WORKS"
      title="From brief to delivery, without the back-and-forth."
    >
      <ol className="space-y-6">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-4">
            <span className="mono-label flex-none text-orange">{s.n}</span>
            <div>
              <div className="font-medium text-ink">{s.title}</div>
              <p className="mt-1 text-steel">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <Link href="/start" className={buttonVariants({ className: "mt-4" })}>
        Start a Project
      </Link>
    </MarketingPageShell>
  );
}
