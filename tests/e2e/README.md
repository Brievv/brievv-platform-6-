# End-to-end tests

Three specs, one per critical journey from the build spec:

- `client-journey.spec.ts` — spec §63: brief submission through payment and delivery tracking
- `professional-journey.spec.ts` — spec §64: application through verification and matching eligibility
- `admin-journey.spec.ts` — spec §65: ops dashboard through quote review, matching, and audit history

## Why the E2E specs don't run in the sandbox that built this repo

This isn't a hand-wave — it was actually tested. PostgreSQL 16 installs
and runs fine here (`apt-get install postgresql` works, since Ubuntu's
package mirrors are reachable). What's blocked is Prisma's own tooling:
`npx prisma generate` needs to download a query-engine binary from
`binaries.prisma.sh`, and that host is explicitly denied by this
environment's network policy (`curl` against it returns `403` with
`x-deny-reason: host_not_allowed` — a deliberate block, not a timeout).
There's no bundled fallback binary in Prisma's npm packages, no mirrored
copy on GitHub Releases for `prisma/prisma-engines`, and compiling the
engine from Rust source via `cargo` (crates.io is reachable) is a
20–30+ minute build with no guaranteed version match — not a reasonable
thing to do in a chat session. On a normal machine or CI runner with
unrestricted network access, none of this applies; `npx prisma generate`
just works.

## Running them for real

```bash
# 1. Full local setup (see main README.md Quick Start)
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed   # creates ops@brievv.dev / BrievvAdmin!2026 and demo projects
npx playwright install --with-deps chromium

# 2. Configure test-mode credentials in .env.local:
#    AI_API_KEY          — a real Anthropic key (client-journey calls the live estimator)
#    STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY / STRIPE_WEBHOOK_SECRET — Stripe test mode
#    S3_* — a real (or local MinIO) S3-compatible bucket, for the file-upload steps

# 3. In a separate terminal, forward Stripe webhooks locally:
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 4. Run the suite (starts the dev server automatically if E2E_BASE_URL isn't set)
npm run test:e2e
```

## Known gaps these specs document rather than hide

Per the instruction to test against what's actually built, not what the
spec originally asked for:

- **Quote editing**: `admin-journey.spec.ts` reviews a quote but doesn't
  test editing its price/timeline/team after generation — there's no
  edit UI for that yet.
- **Exports**: only the quote PDF export exists today. Project summary
  PDF, invoice PDF, and CSV exports (spec §74) aren't built.
- **File upload steps** in `client-journey.spec.ts` are described but not
  asserted against, since they require real S3 credentials this sandbox
  doesn't have — wire in `page.setInputFiles(...)` once you're running
  against a real bucket.

If you fix one of these gaps, update the matching spec file to actually
assert on it instead of skipping/noting it — an E2E test that silently
tolerates a missing feature forever is worse than no test.
