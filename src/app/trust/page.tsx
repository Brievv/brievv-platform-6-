import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

const SECTIONS = [
  { title: "Security", body: "Server-side authentication and authorization on every request, signed URLs for file access, encrypted secrets, and security headers including a strict Content-Security-Policy." },
  { title: "Privacy", body: "Organizations only ever see their own projects, files, messages, and invoices. Tenant isolation is enforced server-side, not just in the UI." },
  { title: "Data handling", body: "Files are stored in S3-compatible object storage, never in the database, and are only ever accessed through short-lived signed URLs." },
  { title: "Access controls", body: "Role-based permissions are enforced in application code on every protected action — a hidden button is never the only protection." },
  { title: "Professional verification", body: "Professionals pass a verification workflow before being eligible for project matching. Regulated work requires verified licensing." },
  { title: "Quality control", body: "Every deliverable passes through project-lead review, a discipline-specific quality checklist, and client review before final delivery." },
  { title: "AI governance", body: "AI produces recommendations only. Deterministic pricing rules set the actual quote boundaries, and high-complexity or regulated work always requires human review before a quote is sent." },
];

export default function TrustPage() {
  return (
    <MarketingPageShell eyebrow="§ TRUST CENTER" title="How BRIEVV handles security, privacy, and quality.">
      <div className="space-y-6">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h2 className="font-medium text-ink">{s.title}</h2>
            <p className="mt-1 text-steel">{s.body}</p>
          </div>
        ))}
      </div>
    </MarketingPageShell>
  );
}
