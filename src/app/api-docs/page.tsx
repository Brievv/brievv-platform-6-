import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

interface Endpoint {
  method: string;
  path: string;
  auth: string;
  description: string;
  request?: string;
  response?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "POST",
    path: "/api/v1/ai/estimate",
    auth: "Optional (anonymous briefs are attributed to a system placeholder account)",
    description: "Submits a project brief, persists it, and runs the AI estimation pipeline. Saves the brief before calling AI — a failed AI call never loses client data.",
    request: `{ title, disciplines[], scopeDescription, urgency, uploadedFiles[], contactName, contactEmail, ... }`,
    response: `{ status, referenceCode, projectId, quoteId, priceLowCents, priceHighCents, timeline, team[], scopeSummary, assumptions[], risks[], requiresHumanReview }`,
  },
  {
    method: "POST",
    path: "/api/v1/uploads/presign",
    auth: "Required for projectId/verification scope; anonymous OK for intakeId scope",
    description: "Returns a short-lived presigned URL for direct-to-storage upload. Exactly one of intakeId, projectId, or verification must be provided.",
    request: `{ intakeId | projectId | verification, fileName, mimeType, sizeBytes }`,
    response: `{ fileId, storageKey, uploadUrl, expiresInSeconds }`,
  },
  {
    method: "POST",
    path: "/api/v1/quotes/:id/checkout",
    auth: "Required (project owner only)",
    description: "Creates a Stripe Checkout Session for a project deposit. Only callable once the quote's status is already ACCEPTED.",
    response: `{ url }`,
  },
  {
    method: "GET",
    path: "/api/v1/quotes/:id/pdf",
    auth: "Required (project owner or internal staff)",
    description: "Streams a branded PDF export of a quote.",
    response: "application/pdf",
  },
  {
    method: "POST",
    path: "/api/v1/files/:fileId/analyze",
    auth: "Required (project owner or internal staff)",
    description: "Runs AI document-content analysis on a PDF (extracts text, classifies the document, flags missing information and inconsistencies for human review).",
    response: `{ analysisId, result: { documentType, identifiedDiscipline, approximateScope, missingInformation[], inconsistencies[], requiredSpecialists[], expectedDeliverables[] } }`,
  },
  {
    method: "GET / POST",
    path: "/api/v1/notifications",
    auth: "Required",
    description: "GET returns the caller's 20 most recent notifications + unread count. POST marks one (notificationId) or all (markAll) as read.",
  },
  {
    method: "GET",
    path: "/api/v1/search?q=",
    auth: "Required",
    description: "Global search across projects, quotes, and — for internal staff only — professionals and clients. Powers the Cmd/Ctrl+K command palette.",
    response: `{ results: [{ type, id, title, subtitle, href }] }`,
  },
  {
    method: "POST",
    path: "/api/v1/auth/register",
    auth: "Public",
    description: "Creates a client account (bcrypt-hashed password, role: CLIENT).",
  },
  {
    method: "POST",
    path: "/api/webhooks/stripe",
    auth: "Stripe signature (Stripe-Signature header, verified against STRIPE_WEBHOOK_SECRET)",
    description: "Signature-verified, idempotent (via WebhookEvent) handler for checkout.session.completed, payment_intent.payment_failed, and charge.refunded. This is the only place project status advances to READY_TO_START after payment — never the client-facing checkout route itself.",
  },
];

export default function ApiDocsPage() {
  return (
    <>
      <SiteNav />
      <main className="py-16 lg:py-24">
        <div className="container-brievv max-w-3xl">
          <div className="mono-label mb-4">§ API</div>
          <h1 className="font-display text-3xl font-medium text-ink lg:text-4xl">API Reference</h1>
          <p className="mt-4 text-steel">
            Every endpoint below is versioned under <code className="font-mono text-sm">/api/v1</code> and actually
            implemented in this codebase — this documents what exists, not a planned surface. Authentication uses
            the same session cookie as the web app (NextAuth); there is no separate API key issuance yet, so this
            API is not currently designed for third-party integrations outside the BRIEVV frontend. Rate limiting
            and a public API key system are tracked as future work.
          </p>

          <div className="mt-10 space-y-6">
            {ENDPOINTS.map((e) => (
              <div key={e.path + e.method} className="glass-surface rounded-md p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded bg-ink px-2 py-1 font-mono text-xs text-white">{e.method}</span>
                  <code className="font-mono text-sm text-ink">{e.path}</code>
                </div>
                <p className="mt-3 text-sm text-steel">{e.description}</p>
                <p className="mt-2 font-mono text-xs text-steel/70">Auth: {e.auth}</p>
                {e.request && (
                  <div className="mt-3">
                    <div className="mono-label mb-1">Request</div>
                    <code className="block overflow-x-auto rounded bg-ink/[0.04] p-3 font-mono text-xs text-ink">{e.request}</code>
                  </div>
                )}
                {e.response && (
                  <div className="mt-3">
                    <div className="mono-label mb-1">Response</div>
                    <code className="block overflow-x-auto rounded bg-ink/[0.04] p-3 font-mono text-xs text-ink">{e.response}</code>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="mt-10 text-xs text-steel">
            See <code className="font-mono">docs/API.md</code> in the repository for the same reference in Markdown,
            and <code className="font-mono">docs/ARCHITECTURE.md</code> for how these endpoints fit into the wider
            system.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
