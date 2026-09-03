# BRIEVV API Reference

Every endpoint here is versioned under `/api/v1` and actually implemented
in this codebase — this documents what exists, not a planned surface.
There's also a rendered version at `/api-docs` in the running app.

## Authentication

All endpoints use the same session cookie as the web app (NextAuth JWT
session). There is no separate API key system yet — this API isn't
currently designed for third-party integrations outside the BRIEVV
frontend itself. A public API key + rate-limiting layer is tracked as
future work (see `docs/ROADMAP.md`, Phase 6).

## Endpoints

### `POST /api/v1/ai/estimate`
**Auth:** optional (anonymous briefs are attributed to a system placeholder user)
Submits a project brief. Persists the `Project` row *before* calling the
AI provider (see `docs/ARCHITECTURE.md` §2) — a failed AI call never
loses client data. Runs the deterministic pricing engine on top of the
AI's suggestion.

```
Request:  { title, disciplines: string[], scopeDescription, urgency,
            uploadedFiles?: [{storageKey, fileName, mimeType, sizeBytes}],
            contactName, contactEmail, contactPhone?, jurisdiction?,
            requiredSoftware?: string[], requiresLicense?,
            budgetLowCents?, budgetHighCents? }
Response: { status, referenceCode, projectId, quoteId,
            priceLowCents, priceHighCents, timeline, team: string[],
            scopeSummary, assumptions: string[], risks: string[],
            requiresHumanReview }
```

### `POST /api/v1/uploads/presign`
**Auth:** required for `projectId`/`verification` scope; anonymous OK for `intakeId`
Returns a presigned S3-compatible PUT URL. Exactly one of `intakeId`,
`projectId`, or `verification: true` must be given — see
`src/app/api/v1/uploads/presign/route.ts` for the three scoping rules.

```
Request:  { intakeId | projectId | verification: true,
            fileName, mimeType, sizeBytes }
Response: { fileId, storageKey, uploadUrl, expiresInSeconds }
```

### `POST /api/v1/quotes/:id/checkout`
**Auth:** required, project owner only
Creates a Stripe Checkout Session for the project deposit. Rejects with
`409` unless the quote's status is already `ACCEPTED` — there's no path
from an unapproved quote straight to payment.

```
Response: { url }  // redirect the browser here
```

### `GET /api/v1/quotes/:id/pdf`
**Auth:** required, project owner or internal staff
Streams a branded PDF (`application/pdf`) rendered via `@react-pdf/renderer`.

### `POST /api/v1/files/:fileId/analyze`
**Auth:** required, project owner or internal staff
Runs AI document-content analysis (spec §11) on a PDF: extracts text,
classifies the document, flags missing information/inconsistencies for a
human reviewer. Returns `422` for non-PDF files or PDFs with no
extractable text layer (e.g. scanned images).

```
Response: { analysisId, result: {
  documentType, identifiedDiscipline, approximateScope,
  missingInformation: string[], inconsistencies: string[],
  requiredSpecialists: string[], expectedDeliverables: string[]
}}
```

### `GET /api/v1/notifications` / `POST /api/v1/notifications`
**Auth:** required
GET returns the caller's 20 most recent notifications + unread count.
POST marks one (`{ notificationId }`) or all (`{ markAll: true }`) read
— scoped to the caller's own notifications only.

### `GET /api/v1/search?q=`
**Auth:** required
Global search powering the Cmd/Ctrl+K command palette. Clients only ever
search their own projects/quotes; internal staff search across
projects, quotes, professionals, and clients.

```
Response: { results: [{ type, id, title, subtitle, href }] }
```

### `POST /api/v1/auth/register`
**Auth:** public
Creates a client account. Passwords are bcrypt-hashed (cost factor 12)
before storage.

### `POST /api/webhooks/stripe`
**Auth:** Stripe signature (`Stripe-Signature` header verified against `STRIPE_WEBHOOK_SECRET`)
Signature-verified and idempotent (every event ID is recorded in
`WebhookEvent` before processing). Handles `checkout.session.completed`,
`payment_intent.payment_failed`, `charge.refunded`. This is the **only**
place a project's status advances to `READY_TO_START` after payment —
see `docs/ARCHITECTURE.md` §8 for why that's deliberate.

### `GET/POST /api/auth/[...nextauth]`
NextAuth's own handler — sign-in, sign-out, session, CSRF token, and
OAuth callback routes. Not versioned (NextAuth owns this URL space).

## Error format

Every endpoint returns errors as `{ "error": "human-readable message" }`
with an appropriate HTTP status (`401` unauthenticated, `403` forbidden,
`404` not found, `422` validation failure, `500` server error). None of
these leak stack traces or internal details — see `src/app/error.tsx`
and the try/catch pattern used in every route handler.
