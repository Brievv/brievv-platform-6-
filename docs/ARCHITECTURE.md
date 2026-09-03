# BRIEVV — Architecture

## 1. High-level shape

Next.js App Router serves both the UI and the API (`src/app/api/**`). There is
no separate backend process required for Phase 1 — server components and
route handlers run on the same Next.js server and talk to Postgres via
Prisma. This can be split into a standalone service later (e.g. moving
`src/server/**` behind its own deployment) without changing the interfaces,
because business logic already lives in `src/server/services/*`, not in UI
components or route handlers directly.

```
Browser
  │
  ├─▶ Next.js Server Components (read data via Prisma directly)
  ├─▶ Next.js Route Handlers  /api/v1/**  (validate → call services → persist)
  │        │
  │        ▼
  │   src/server/services/**  (pricing engine, AI estimator, matching — TODO)
  │        │
  │        ▼
  │   Prisma ──▶ PostgreSQL
  │
  └─▶ NextAuth  ──▶ Google / Microsoft / credentials+bcrypt
```

## 2. Why the AI call is structured the way it is

Spec requirement: *"AI must ONLY be called server-side"* and *"AI should
provide a recommendation, while deterministic business rules control the
actual pricing boundaries."*

The flow in `src/app/api/v1/ai/estimate/route.ts`:

1. Validate the incoming brief with Zod (`briefInputSchema`).
2. **Persist the `Project` row immediately**, status `ANALYZING`. This is the
   AI-failure fallback from spec §46 — if the AI call throws below, the
   client's brief already exists in the database with a safe status; nothing
   is lost, and ops can generate the quote manually.
3. Call `generateEstimate()` (`src/server/services/ai/estimator.ts`), which:
   - Builds a prompt asking the model for a *recommended* price band, team,
     timeline, assumptions, and risks — strictly as JSON.
   - Runs `computePriceBand()` (`src/server/services/pricing/pricing-engine.ts`)
     — a pure, deterministic function driven by the `PricingRule` table
     (complexity multiplier, urgency multiplier, discipline count, specialist
     surcharge, platform margin).
   - Calls `clampAISuggestion()` to force the AI's number inside that band.
     The AI can narrow the estimate; it can never quote outside the rules.
   - Calls `requiresHumanReview()` — large/regulated/high-value projects are
     always flagged for a human before the quote is sent (spec §43).
4. Persists an `AIAnalysis` row (full audit trail of what was sent/returned)
   and a `Quote` row with the clamped numbers.

Swapping providers (Anthropic → OpenAI → something else) means implementing
`AIProvider` (`src/server/services/ai/provider.ts`) in one new file and adding
a branch in `src/server/services/ai/index.ts` — nothing else changes.

## 3. RBAC — why it's not just hidden buttons

`src/lib/rbac.ts` defines a `Permission` union and a role→permissions map.
`src/middleware.ts` uses the session role to redirect at the route level
(so a client never even sees `/admin` in navigation), but the actual
authorization boundary is `assertCan(role, permission)`, which every
server action / route handler must call before doing anything sensitive.
Middleware can be bypassed by hitting an API route directly with a crafted
request — `assertCan` cannot, because it runs in the same process as the
database mutation.

## 4. Multi-tenancy

`Organization` → `OrganizationMember` → `User` models isolate data per
company. Every Prisma query that returns client-owned data (`Project`,
`Invoice`, etc.) must filter by `organizationId` or `createdByUserId` — see
`src/app/dashboard/page.tsx` for the pattern. This needs to be enforced
consistently as more queries are added; the recommended next step is a thin
repository layer (`src/server/repositories/`, currently scaffolded empty)
that bakes the tenant filter into every read so it can't be forgotten.

## 5. State machines

`ProjectStatus`, `QuoteStatus`, and `ProfessionalStatus` are Prisma enums
matching spec §54–56 exactly. `ProjectStatusEvent` gives every project a full
timestamped history (spec §16). Phase 2 should add an explicit transition
table (e.g. `src/server/services/projects/status-machine.ts`) that rejects
invalid transitions server-side, rather than trusting callers to only ever
set valid next-states.

## 6. What's deliberately stubbed

| Area | Current state | Why |
|---|---|---|
| Stripe payments | ✅ implemented (`src/server/services/payments/stripe.ts`) — Checkout Sessions for deposits, signature-verified idempotent webhook | Needs a real Stripe account + webhook endpoint configured in the Stripe dashboard pointing at `/api/webhooks/stripe` |
| File storage | ✅ implemented (`src/server/services/storage/s3-storage.ts`) — presigned upload/download, key generation, validation | Needs real `S3_*` credentials (AWS S3 / R2 / Supabase) to actually store bytes; returns a clear 503 until configured |
| Malware scanning | ✅ interface + graceful "pending" state (`src/server/services/security/malware-scan.ts`) | Needs a ClamAV or VirusTotal account wired into the one `TODO` branch |
| Email | `RESEND_API_KEY` + `EMAIL_FROM` env vars exist; templates not yet built | Needs a verified sending domain to actually test deliverability |
| Matching engine | `Assignment` model + weight structure documented in spec; scoring function not yet implemented | Needs professional data (seeded) to be meaningful to build against |
| Background jobs | No queue wired yet | Needs Redis; architecture assumes BullMQ per spec §48 |

None of these are "faked" — the schema, env vars, and typed touchpoints all
exist so that implementing them is additive, not a rewrite.

## 7. Design system

Tailwind tokens in `tailwind.config.ts` mirror the spec's exact hex palette.
Fonts: Inter (sans/body), Space Grotesk (display/headings), JetBrains Mono
(labels, reference codes, technical annotations) — loaded via `next/font`
so there's no FOUC and no external font request at runtime. Components in
`src/components/ui/` are intentionally small and composable (no all-in-one
"DataTable god component") so they can be extended into the fuller set
(modals, drawers, command palette, etc.) without fighting existing code.

## 8. Payment flow — why status changes happen where they do

Per spec §13 ("Do not begin paid project execution until the appropriate
payment/authorization condition is satisfied"), the project status machine
enforces this in two places, not one:

1. `approveQuote()` (`src/app/dashboard/quotes/[id]/actions.ts`) moves the
   project to `QUOTE_ACCEPTED` — approving a quote is a client decision,
   not a payment event, so it deliberately does **not** touch payment state.
2. `/api/v1/quotes/[id]/checkout` refuses to create a Stripe Checkout
   Session unless the quote's status is already `ACCEPTED` — so there's no
   route that lets checkout happen before approval.
3. The actual `READY_TO_START` transition only happens inside the Stripe
   **webhook** handler, after `checkout.session.completed` is verified —
   never inside the checkout-creation route itself, because that route
   only knows a payment was *requested*, not that it *succeeded*. Trusting
   the client's redirect back to `/dashboard/projects/[id]?checkout=success`
   as proof of payment would be trivially spoofable; only the
   signature-verified webhook is treated as the source of truth.

This is why `Payment` rows are created in `PENDING` status at checkout-session
creation time, and only flipped to `PAID` inside the webhook.

## 9. Messaging — how client/internal isolation is enforced

Per spec §29/§72 ("internal notes must never appear in the client portal"),
`MessageThread.isInternal` distinguishes a client-facing thread from an
ops-only one. The isolation isn't a display filter — the client-facing
messages page (`src/app/dashboard/projects/[id]/messages/page.tsx`) only
ever *queries* `isInternal: false` threads; it has no code path that could
fetch an internal thread's rows in the first place. A future internal ops
messaging view should live under `/admin`, as its own query, rather than
reusing this component with a "hide internal" flag — a flag that can be
forgotten is worse than a query that structurally can't return the wrong rows.

## 10. Deliverables — folder-scoped files, signed downloads only

`ProjectFile.folder` (spec §18's five folders: Client Inputs, Working
Files, Reviews, Deliverables, Final) is what the Deliverables tab filters
on — it queries `folder: "DELIVERABLES"` rather than maintaining a
separate deliverables table. Uploading a deliverable reuses the same
presigned-URL flow as the intake wizard (`FileDropzone`, generalized to
accept either an `intakeId` or an authenticated `projectId` scope — see
`/api/v1/uploads/presign`), and every download goes through
`getDeliverableDownloadUrl()`, which mints a short-lived signed GET URL
per request rather than ever storing or exposing a permanent object URL.

## 11. Activity — read the audit trail, don't duplicate it

The Activity tab has no dedicated "activity" table. It reads
`ProjectStatusEvent` (written by the estimate/checkout/webhook/quote-
approval code) and cross-references `AuditLog` rows whose `entityId`
belongs to the project (its tasks, milestones, quotes, or payments) —
both tables the app already writes to for other reasons. Adding a new
kind of trackable action anywhere in the app means it shows up here for
free the moment that code path calls `db.auditLog.create()`, with no
second write to keep in sync.

## 12. Matching — deterministic scoring, not an AI call

Per spec §22, matching uses a weighted scoring function
(`src/server/services/matching/matching-engine.ts`), not an LLM — skill
overlap, years of experience, availability, jurisdiction match, quality
score, and cost fit are all structured data the app already has, and a
transparent formula ranks candidates more predictably and auditably than
a model call would (every score's breakdown is shown to the ops user in
`/admin/matching`, not just a final number).

The regulated-work safety rule ("never automatically assign professionals
to regulated work if required licensing has not been verified") is
enforced inside `scoreProfessional()` itself, not as a separate filter a
caller could forget to apply: a professional who lacks a license for a
regulated discipline (`REGULATED_DISCIPLINES` — Architecture, Structural,
Civil, MEP) is marked `eligible: false` with `score: 0` before any
weighting happens, so there's no code path that could accidentally rank
them highly and let an admin propose them anyway.

Admins still make the final call — `runMatchingForProject()` only *ranks*
candidates; `proposeAssignment()` is a separate, explicit action, and
professionals must separately accept the proposal (`/pro/assignments`)
before a project moves to `TEAM_ASSIGNED`. Nothing here auto-assigns.

## 13. Pricing rules — admin-editable, not just admin-visible

`resolvePricingConfig()` in `src/server/services/ai/estimator.ts` queries
the `PricingRule` table on every estimate: a discipline-specific active
rule first, then a global active rule, then a hardcoded fallback if the
table is empty. This closes the loop spec §41 asks for — editing a rule
in `/admin/pricing-rules` changes what the next brief is quoted at
immediately, with no redeploy — rather than leaving the pricing engine
permanently on hardcoded constants while an admin UI just sits next to it
disconnected.

## 14. Admin RBAC — every mutating action re-checks permission server-side

Every `/admin/*` server action in this phase (`approveProfessional`,
`refundPayment`, `changeUserRole`, `createPricingRule`, `createDiscipline`,
`updateTaskStatusAdmin`, etc.) calls `assertCan(role, permission)` from
`src/lib/rbac.ts` at the top of the function, independent of whether the
`/admin` route itself was reachable. This matters because `middleware.ts`
only gates *page navigation* — a request straight to a server action
bypasses it — so the permission check inside the action is the actual
authorization boundary, exactly as described in ARCHITECTURE.md §3.

## 15. Notifications — one service, real-only channels, honest about email

`notify()` (`src/server/services/notifications/notify.ts`) is the single
path every server action uses to notify a user — never a direct
`db.notification.create()` scattered around the codebase, so channel
routing logic lives in one place. IN_APP notifications always persist
(that's what the bell reads); the email leg is a deliberate no-op with an
explanatory comment when `RESEND_API_KEY` isn't set, rather than a log
line claiming an email was sent when it wasn't — the same "don't fake an
integration" principle applied to Stripe and the AI provider elsewhere in
this codebase.

`notifyOps()` fans out to every active `OPERATIONS_ADMIN`/`SUPER_ADMIN` —
a small-team assumption that holds for a founder-led ops model but should
be replaced with per-project owner assignment once `ProjectMember` roles
are actually used to track who's running a given project.

The bell itself (`NotificationBell`) polls `/api/v1/notifications` every
30 seconds rather than using a WebSocket/SSE connection — spec §61 lists
real-time infrastructure as a deliberate later upgrade, and polling is the
honest interim rather than a fake "live" indicator backed by nothing.

## 16. Testing — what actually ran, and a bug it found

The unit test suite (`tests/unit/`) targets the parts of this codebase
that are pure functions with no database or network dependency: the
pricing engine, the matching engine, and upload validation. These
genuinely executed during development (`npm test` — 45 tests, all
passing) rather than being written and assumed correct.

Writing them caught a real bug: `formatCents()` in `src/lib/utils.ts` had
no guard against `NaN` — `formatCents(NaN)` returned the string `"$NaN"`
instead of the intended `"—"` fallback. The test wrote the intended
behavior first, ran it, watched it fail, and the source got a one-line
fix (`Number.isNaN(cents)` added to the existing null/undefined check).
That's the sequence a test suite should produce — if every test had
simply matched whatever the code already did, the suite wouldn't be
verifying anything.

Writing the E2E specs (`tests/e2e/`, not executable in this sandbox — see
`tests/e2e/README.md`) surfaced a second real issue while checking
selectors against actual rendered markup instead of guessing them: the
`/start` intake wizard's local `Field` wrapper component rendered a
`<label>` as a sibling of its input with no `htmlFor`/`id` pairing and no
DOM nesting — meaning screen readers (and Playwright's `getByLabel`,
which relies on the same accessible-name computation) couldn't associate
the label with its control at all. This was a real WCAG 2.2 AA gap (spec
§38), not just a test-selector inconvenience, so it was fixed at the
source (`Field` now generates an id via `useId()` and clones its child
with that id, rather than the test being rewritten to route around a
broken accessibility tree via CSS selectors instead of labels).

## 17. MFA — why it's a two-step credentials flow, not a separate endpoint

NextAuth's credentials provider is normally single-step (email + password
in, session out). Adding TOTP without a second provider or a custom API
route means `authorize()` has to distinguish three outcomes instead of
two: wrong password (reject silently, as always), correct password but
no code yet (ask for one), and correct password with a wrong code (reject
with a specific reason). This is done by throwing distinguishable errors
— `MFA_REQUIRED` and `MFA_INVALID` — which NextAuth's `signIn(...,
{ redirect: false })` surfaces as `result.error` on the client. The
sign-in page (`src/app/sign-in/page.tsx`) checks for exactly those two
strings to decide whether to show the code-entry screen or a generic
"incorrect password" message — any other thrown message would fall
through to the generic case, so this only works because the two error
strings are exact, deliberate constants shared between `auth.ts` and the
sign-in page, not free-text messages.

The secret itself is never sent back to the browser after initial setup:
`startMfaSetup()` returns the plaintext secret and QR code once, and
`confirmMfaSetup()` only ever receives that same plaintext back from the
client to verify a code against it — the encrypted form that actually
gets persisted to `User.mfaSecret` is computed server-side and never
leaves the server. Encryption key derivation reuses `AUTH_SECRET`
(SHA-256'd down to a fixed 32-byte key) rather than requiring a second
secret to provision — one fewer credential to rotate and keep in sync.
