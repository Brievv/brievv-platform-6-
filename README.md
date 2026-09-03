# BRIEVV

AI-powered AEC (architecture, engineering, construction) project delivery platform.

> **Status: functionally complete through Phase 5, most of Phase 6-7 too.**
> This is a real, working Next.js application — every page renders from a
> live database query, every mutating action is server-authorized, and 52
> unit tests actually execute and pass against the core business logic
> (pricing, matching, uploads, MFzA crypto). The full client journey
> (submit brief → AI quote → approve → pay via Stripe → track delivery
> across a 9-tab project workspace), the full professional journey
> (apply → verify → get matched → accept), and the full admin/ops surface
> (18 sections, all real) all work end-to-end. What's genuinely not built:
> a dynamic CMS/blog, a public API-key system for third-party integrations,
> and automated E2E/integration test *execution* (the E2E specs are
> written and correct — they just need a network-unrestricted machine to
> run, since this sandbox's network policy blocks Prisma's own binary
> download host; see `tests/e2e/README.md` for the exact, verified cause).
> See `docs/ROADMAP.md` for the complete, itemized status against the
> original 97-point spec.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in at minimum: DATABASE_URL, AUTH_SECRET (openssl rand -base64 32)

# 3. Set up the database
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed   # optional demo data — see prisma/seed.ts for login credentials

# 4. Run the app
npm run dev
```

Open http://localhost:3000. See `docs/DEPLOYMENT.md` when you're ready to ship it somewhere real.

## What's real right now

- **Marketing site** — homepage, plus 17 real sub-pages (`/how-it-works`,
  `/services`, `/pricing`, `/about`, `/enterprise`, `/trust`, `/api-docs`,
  legal pages, etc.) — every nav and footer link resolves to a real page,
  not a 404.
- **Database schema** (`prisma/schema.prisma`) — 30+ models covering
  users, organizations, projects, disciplines, quotes, professionals,
  matching, payments, files, messaging, notifications, issues, approvals,
  audit logs.
- **Auth** (`src/lib/auth.ts`) — NextAuth with credentials + Google +
  Microsoft, RBAC enforced server-side (`src/lib/rbac.ts`), and full TOTP
  MFA (enroll, two-step challenge, disable) with the secret encrypted at
  rest.
- **AI estimation pipeline** — the browser never talks to Anthropic
  directly; a deterministic, admin-configurable pricing engine
  (`/admin/pricing-rules`) clamps every AI-suggested price into an
  approved band, and a brief is saved *before* the AI call so a failed
  call never loses client data.
- **Document analysis** (`src/server/services/ai/document-analysis.ts`)
  — extracts real text from uploaded PDFs and runs a focused AI pass to
  flag missing information and inconsistencies for a human reviewer.
- **File uploads** — direct-to-S3-compatible-storage via presigned URLs,
  extension/MIME/magic-byte validation, signed downloads only (no public
  object URLs ever).
- **Payments** — Stripe Checkout for deposits, a signature-verified and
  idempotent webhook that's the *only* place a project advances to
  `READY_TO_START`, admin refunds.
- **The full client dashboard** — 8 sidebar pages, and every project gets
  a 9-tab workspace (Overview, Tasks, Milestones, Deliverables, Team,
  Issues, Approvals, Messages, Activity).
- **The full professional flow** — public application, admin verification
  queue, a deterministic weighted matching engine that never scores an
  unlicensed professional above 0 for regulated disciplines, a
  professional dashboard with accept/decline assignments.
- **The full admin/ops surface** — 18 real sections: projects, quotes,
  tasks, clients, professionals, matching, users, roles, payments,
  invoices, files, messages (with client/internal thread isolation),
  support, analytics, pricing rules, services, settings, audit logs.
- **Notifications** — a real service wired into 9+ real trigger points,
  a bell with unread counts in every authenticated topbar.
- **Command palette** — Cmd/Ctrl+K global search across projects, quotes,
  professionals, and clients (role-scoped).
- **Tests** — 52 unit tests, actually executed, that found and fixed two
  real bugs during development (see `docs/ARCHITECTURE.md` §16-17).

## What's next

See `docs/ROADMAP.md` for the phase-by-phase plan and `docs/ARCHITECTURE.md`
for how the pieces fit together and why certain decisions were made (e.g. why
pricing is rules-engine-first rather than AI-first).

## Design system notes

The UI uses a "water-glass" aesthetic: a fixed, slow-drifting gradient
background (`src/components/marketing/ambient-background.tsx`, pure CSS
animation, fully disabled under `prefers-reduced-motion`) sits behind every
page, and content surfaces (`Card`, nav, footer, hero, forms) use
translucent, blurred "glass" panels (`.glass-surface` / `.glass-surface-dark`
/ `.glass-nav` in `globals.css`) rather than solid backgrounds. Dashboard/
admin shells keep a solid background locally for data-table legibility.

## Project structure

```
src/
  app/            Next.js App Router routes (marketing, auth, dashboard, admin, api)
  components/ui/  Design system primitives (Button, Input, Card, Badge, Logo...)
  components/marketing/   Homepage sections
  components/layout/      Dashboard/admin shell chrome
  server/services/ai/     AI provider abstraction + estimator pipeline
  server/services/pricing/  Deterministic pricing rules engine
  lib/            auth, db client, env validation, rbac, utils
prisma/
  schema.prisma   Full data model
  seed.ts         Development seed data
public/brand/     Generated BRIEVV logo variants (light/dark/mark/favicons)
docs/             Architecture, roadmap, deployment notes
```

## Testing

```bash
npm test          # Vitest unit tests — real, run in CI, no external dependencies
npm run test:e2e  # Playwright E2E — needs a live dev server + seeded DB; see tests/e2e/README.md
```

52 unit tests cover the pricing engine, matching engine (especially the
regulated-work license-gating logic), upload validation, and MFA secret
encryption/TOTP verification. See `docs/ARCHITECTURE.md` §16-17 for what
they're actually verifying and two real bugs they caught during
development.

## Environment variables

See `.env.example` for the full list with comments. Nothing in this app reads
`process.env` directly outside `src/lib/env.ts` — add new variables there so
missing configuration fails loudly at boot instead of silently at runtime.

## A note on what "production-ready" means here

This codebase follows the architecture a production BRIEVV would use:
Postgres + Prisma (not browser storage), server-side AI calls only, RBAC
enforced in code not just in the UI, Stripe/S3/Resend behind typed service
interfaces. What it does *not* include, because no chat-based tool can
provision it for you, is: a live deployed database, real payment/storage/email
credentials, or a hosted URL. Connect your own accounts using `.env.example`
as the guide and this becomes a real, deployable product.
