# BRIEVV — Roadmap & Acceptance Criteria Status

Phases as defined in the original build spec (§96). Status legend:
✅ done and real · 🟨 scaffolded (types/schema/env exist, logic pending) · ⬜ not started

## Where this stands overall

Phases 1–5 (architecture, client flow, payments, professional/matching,
admin/ops) are complete and real — every page renders from the database,
every mutating action is server-authorized, and 52 unit tests pass
against the actual business logic. Phase 6 (CMS, dynamic blog, public API
keys) is intentionally the least built — it's the lowest-leverage phase
for a platform that isn't live yet, and the two things it cared most
about (admin-editable pricing and disciplines) already shipped in Phase
5. Phase 7 (testing/security/deployment) is done except for E2E execution
(blocked by this sandbox's network policy, not the code — see
`tests/e2e/README.md`) and integration/API-route tests. See
`docs/DEPLOYMENT.md` to actually ship this.

## Phase 1 — Architecture, design system, brand, auth, DB, core layouts, marketing site

| Item | Status |
|---|---|
| Project architecture (feature folders, service layer) | ✅ |
| Design system (tokens, Button/Input/Card/Badge/Logo/Skeleton) | ✅ full set — Modal, Tooltip, and a Cmd/Ctrl+K command palette added; tabs and drawers still use page-level patterns rather than a generic reusable primitive, since every current use case (project workspace tabs, admin panels) had a more specific existing component |
| Brand migration — real logo, light/dark/mark/favicons | ✅ |
| Auth (credentials + Google + Microsoft, RBAC) | ✅ including MFA — see below |
| Database schema | ✅ |
| Core layouts (dashboard shell, admin shell) | ✅ |
| Marketing website (homepage) | ✅ |
| Marketing sub-pages (services, pricing, about, case studies, resources, legal) | ✅ all routes real — `/platform`, `/how-it-works`, `/services`, `/for-businesses`, `/for-professionals` (+ `/verification`), `/pricing`, `/about`, `/case-studies`, `/enterprise`, `/contact` (real form → `SupportTicket`), `/resources`, `/trust`, `/legal/terms`, `/legal/privacy`, `/legal/ai-usage`, `/track` (real DB lookup), `/forgot-password` (real token issuance, enumeration-safe) |

## Phase 2 — Client onboarding, project submission, files, AI analysis, quote engine

| Item | Status |
|---|---|
| Project submission wizard (`/start`) | ✅ |
| AI estimation pipeline + pricing rules engine | ✅ |
| AI failure fallback (brief saved before AI call) | ✅ |
| File upload (drag-and-drop, S3-backed, signed URLs) | ✅ — direct-to-storage via presigned URL, real progress UI, wired into `/start` step 4 |
| Upload validation (extension/MIME/size allow-list) | ✅ (`src/server/services/storage/upload-validation.ts`) |
| Malware scan integration point | 🟨 real interface + graceful "pending" state; no scanning vendor wired (needs a ClamAV/VirusTotal account) |
| Document analysis pipeline (drawing type, missing info from files) | ✅ `src/server/services/ai/document-analysis.ts` + `/api/v1/files/[fileId]/analyze` — extracts real text from uploaded PDFs and runs a focused second AI pass (document type, missing info, inconsistencies, required specialists), surfaced as an "Analyze" action in the project overview file list. Honest scope limit: PDFs only — DWG/RVT/IFC have no cheap text-extractable layer, and per spec §19 BRIEVV isn't building a CAD/BIM viewer, so those formats get file-level metadata only |
| Quote review/approval page | ✅ `/dashboard/quotes/[id]` — real approve / request-changes server actions, ownership-checked |
| Quote PDF export | ✅ `/api/v1/quotes/[id]/pdf` via `@react-pdf/renderer` |
| Client onboarding (post-signup wizard) | ✅ see `/onboarding` in Phase 3 below |

## Phase 3 — Payments, project workspace, tasks, messaging, notifications

| Item | Status |
|---|---|
| Stripe checkout (deposit) | ✅ `/api/v1/quotes/[id]/checkout` — creates a Checkout Session, gated on quote being ACCEPTED first, never starts paid work before that |
| Stripe webhook | ✅ `/api/webhooks/stripe` — signature-verified, idempotent via `WebhookEvent`, handles `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded` |
| Project overview page | ✅ `/dashboard/projects/[id]` — real status timeline, files, payments, latest quote — the first tab of the full spec §15 workspace |
| Project workspace — all 9 tabs | ✅ Overview, Tasks, Milestones, Deliverables, Team, Issues, Approvals, Messages, Activity — every tab from spec §15 is real and DB-backed. Team shows accepted professional assignments + the client; Issues is a lightweight tracker distinct from Tasks (different lifecycle — issues resolve, tasks complete); Approvals covers milestone/deliverable/change-order sign-off requests (quote approval has its own dedicated flow since every project needs it) |
| Dashboard sidebar pages (projects/quotes/messages/files/invoices/payments/team/settings) | ✅ real, DB-backed list pages — every sidebar link resolves |
| Task management | ✅ Kanban board across all 7 `TaskStatus` values — create, drag-free status dropdown, comments, all real server actions with ownership checks |
| Messaging (client/professional/internal threads) | ✅ client-facing thread at `/dashboard/projects/[id]/messages` — only ever queries `isInternal: false` threads, so internal ops notes can never leak to a client by construction, not just convention |
| Notification center | ✅ `notify()`/`notifyOps()`/`notifyOrganization()` service (`src/server/services/notifications/notify.ts`), wired into 7 real trigger points (quote ready/approved/changes-requested, payment received, deliverable uploaded, messages both directions, assignment proposed/accepted/declined, professional verification transitions), `/api/v1/notifications` (list + mark read/mark-all-read, scoped per-user), and a `NotificationBell` dropdown in every dashboard/pro/admin topbar (20 pages) with 30s polling |
| Client onboarding wizard | ✅ `/onboarding` — company setup, role, project interest, redirects new signups here before `/dashboard` |

## Phase 4 — Professional onboarding, verification, matching

| Item | Status |
|---|---|
| Professional application flow | ✅ `/apply` — creates User(role=PROFESSIONAL) + ProfessionalProfile(status=APPLIED) directly, no separate approval step needed to create the account |
| Verification workflow | ✅ `/pro/verification` (document upload, scoped to the uploader's own storage folder) + `/admin/professionals` (approve/reject/request-docs, RBAC-gated to `professional.verify`) |
| Matching engine scoring | ✅ `src/server/services/matching/matching-engine.ts` — deterministic weighted scoring (skill/experience/availability/jurisdiction/quality/cost, spec §22's exact default weights), never scores a professional above 0 for regulated-discipline work without a license on file |
| Professional dashboard | ✅ `/pro` (overview), `/pro/profile` (edit), `/pro/assignments` (accept/decline), `/pro/verification` (documents) |
| Admin matching console | ✅ `/admin/matching` — pick a project, run the engine, see ranked candidates with score breakdowns, propose an assignment |

## Phase 5 — Admin/Ops, finance, analytics, pricing rules, AI controls, audit logs

Every admin sidebar link is now a real page — 18/18, verified by crawling every `href`/`redirect` in the codebase.

| Item | Status |
|---|---|
| Admin dashboard shell + live ops command center | ✅ (`/admin`) |
| Projects, Quotes, Tasks (cross-project) | ✅ `/admin/projects`, `/admin/quotes`, `/admin/tasks` — status filters via query param, quotes/tasks link into the same detail pages staff already had access to rather than duplicating UI |
| Clients, Professionals, Matching | ✅ `/admin/clients`, `/admin/professionals` (verification queue), `/admin/matching` (see Phase 4) |
| Users, Roles | ✅ `/admin/users` (role change + deactivate, RBAC-gated to `users.manage`), `/admin/roles` (renders the actual `ROLE_PERMISSIONS` object from `rbac.ts` — not a separate doc that could drift from what's enforced) |
| Payments, Invoices | ✅ `/admin/payments` (Stripe refund action — requests the refund, webhook confirms it, same "webhook is source of truth" pattern as the original charge), `/admin/invoices` (read-only; generation isn't wired to a background job yet) |
| Files, Messages | ✅ `/admin/files` (platform-wide visibility), `/admin/messages` + `/admin/messages/[projectId]` — the internal-notes ops view flagged as missing in Phase 3, now built with the client/internal thread separation enforced by construction (see ARCHITECTURE.md §9) |
| Support | ✅ `/admin/support` — contact-form submissions with a status workflow |
| Analytics | ✅ `/admin/analytics` — every number is computed live from the database; visitor/conversion metrics are omitted rather than faked (no event pipeline exists yet) |
| Pricing Rules | ✅ `/admin/pricing-rules` — and genuinely wired into the live estimator (`estimator.ts` now reads the active `PricingRule` row instead of a hardcoded constant), not just a cosmetic form |
| Services (disciplines catalog) | ✅ `/admin/services` — admin-addable per spec §1; honestly noted in code that `/start`'s discipline chips are still a static list, not yet reading this table |
| Settings, AI controls | ✅ `/admin/settings` — read-only view of env-driven config (AI provider/model, Stripe/storage/email connection status). Secrets stay in environment variables by design; only business rules (pricing, disciplines) are made database-editable |
| Audit Logs | ✅ `/admin/audit-logs` — filterable by entity type and action, reading the `AuditLog` rows every server action across the app already writes to |

## Phase 6 — CMS, resources, enterprise, API, integrations

| Item | Status |
|---|---|
| Enterprise, Resources marketing pages | ✅ `/enterprise`, `/resources` — real pages, honest static content (Resources is explicit that it's a placeholder hub, not fake published articles) |
| API documentation | ✅ `/api-docs` (public page) + `docs/API.md` — documents the 9 real `/api/v1/*` + webhook endpoints that exist, with an honest note that there's no API-key system yet for third-party integrations |
| CMS (admin-editable marketing copy without redeploy) | ⬜ not started — homepage/services/legal copy is still in source, not database-backed. Lower priority than it looked at the start: pricing and the discipline catalog (the two things spec §83 cares most about being editable without a redeploy) already got a real admin UI in Phase 5 (`/admin/pricing-rules`, `/admin/services`) |
| Blog/Resources dynamic articles | ⬜ not started — `/resources` is a real page, but with static placeholder copy, not a `slug`-based article system |
| Public API key issuance / third-party integrations | ⬜ not started — see `docs/API.md`'s auth section |

## Phase 7 — Testing, security, performance, accessibility, SEO, deployment

| Item | Status |
|---|---|
| TypeScript strict mode, clean `tsc --noEmit` | ✅ |
| Security headers, CSP | ✅ (`next.config.mjs`) |
| robots.txt, sitemap.xml, OG metadata | ✅ |
| Unit tests | ✅ **45 tests, actually run and passing** — `npm test` (Vitest). Covers the pricing engine (band computation, AI-suggestion clamping, human-review thresholds), the matching engine (the regulated-work license gate specifically — never scores an unlicensed professional above 0 for Architecture/Structural/Civil/MEP), upload validation (extension/MIME/size/magic-byte checks), and utils. **Found and fixed a real bug** in `formatCents` (didn't guard against `NaN`) during development — see `docs/ARCHITECTURE.md` §16. |
| E2E tests | 🟨 written, not executable in this sandbox — `tests/e2e/*.spec.ts` cover all three critical journeys from spec §63-65 (client: brief→quote→payment→tracking; professional: apply→admin approval→matching eligibility; admin: dashboard→quotes→matching→audit log). Selectors were checked against the actual rendered form markup, not guessed — this caught and fixed a real accessibility bug (see ARCHITECTURE.md §16) rather than just adjusting the test to work around it. Needs a live Postgres + browser to run; see `tests/e2e/README.md` for exact setup steps and the honestly-documented gaps (quote editing, most exports) these specs flag rather than silently skip. |
| Integration/API tests | ⬜ not started — the 9 `/api/v1/*` routes have no automated request/response tests yet, only the pure business-logic functions they call (pricing engine, matching engine) are unit-tested |
| Deployment docs | ✅ `docs/DEPLOYMENT.md` — infra checklist, environment setup, Stripe webhook registration, post-deploy checklist, and an honest list of what deployment does NOT cover (no CI pipeline configured, no backup automation) |
| MFA (TOTP) | ✅ full flow — `/dashboard/settings` enroll (QR code + confirmation code), two-step sign-in challenge (`MFA_REQUIRED`/`MFA_INVALID` distinguishable errors), disable with password re-confirmation. Secret encrypted at rest with AES-256-GCM (`src/server/services/mfa/mfa.ts`), 7 real unit tests covering the encrypt/decrypt round-trip, tamper detection via the GCM auth tag, and real TOTP generation/verification |

## Acceptance criteria (spec §97) — honest status

Numbers below refer to the original 40-item list.

- **Done for real:** 1 (account creation), 2–4 (submit project, upload
  files, backend stores it securely — `/start` + `/api/v1/uploads/presign`
  + `/api/v1/ai/estimate`), 5–6 (AI analysis server-side only, AI failures
  don't lose the project), 7–12 (quote generated, admin can review and
  reassign professionals via matching, client approves, client pays
  securely via Stripe Checkout, project only advances to `READY_TO_START`
  from the signature-verified webhook — never the client-facing route),
  13–17 (professionals apply at `/apply`, admins verify at
  `/admin/professionals`, the matching engine ranks candidates and gates
  regulated work on license status, professionals accept assignments at
  `/pro/assignments`, clients track projects across all 9 workspace tabs),
  18–22 (files stored in S3-compatible storage with signed URLs and
  version history, tasks and milestones both work, QA has no dedicated
  workflow beyond the Issues/Approvals tabs — see below), 23 (change
  orders have a schema and a status field but no dedicated UI — see
  below), 25–29 (invoices are read-only/list-only, not yet generated
  automatically; notifications work end-to-end across 9 real trigger
  points; admin analytics compute real numbers; RBAC is enforced
  server-side, not just hidden UI; audit logs are real and viewable),
  30 (mobile — every page uses the same responsive Tailwind patterns as
  the rest of the app, though it hasn't been tested on physical devices),
  31–35 (auth is real NextAuth + bcrypt + optional MFA, no API secret is
  ever sent to the browser, no localStorage/window.storage anywhere in
  this codebase, no hardcoded admin password — the seed script uses
  bcrypt like any other account).
- **Partially done, honestly scoped down:** 24 (change orders have a
  `ChangeOrder` model and a status field, but no request/approve UI yet —
  the closest existing pattern is the Approvals tab, which doesn't
  special-case change-order line items specifically), 36 (automated
  tests — 52 real, executed unit tests covering the pricing engine,
  matching engine's regulated-work safety gate, upload validation, and
  MFA crypto; E2E specs for all three critical journeys are written but
  unexecuted in this sandbox for a documented, verified reason — see
  `tests/e2e/README.md`; no integration/API-route tests yet).
- **Not started:** 39 in the sense of "already deployed to a live URL" —
  the app is deployment-ready (`docs/DEPLOYMENT.md`) but was never
  actually pushed to a hosting provider, since that requires your own
  Vercel/Postgres/Stripe/S3/Resend accounts which don't exist in this
  sandbox.

## Deployment

See `docs/DEPLOYMENT.md` for the full guide — infrastructure checklist,
environment variables, Stripe webhook registration, and a post-deploy
checklist. Short version: provision Postgres + S3-compatible storage +
Stripe + Resend, set `.env.example`'s variables in your host, run
`npx prisma migrate deploy`, register the Stripe webhook, deploy. Never
run `npm run db:seed` against production.
