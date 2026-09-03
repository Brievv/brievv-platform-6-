# Deploying BRIEVV

This app is a standard Next.js 14 App Router application — it deploys
like any Next.js app, with the usual caveats for a project that needs a
real Postgres database, object storage, and a payment processor. Nothing
here is BRIEVV-specific infrastructure; it's the same checklist any
production Next.js + Prisma + Stripe app follows.

## 1. Provision infrastructure

| Need | Recommended options |
|---|---|
| PostgreSQL | Vercel Postgres, Supabase, Neon, or AWS RDS |
| Object storage | Cloudflare R2 (cheapest egress) or AWS S3 |
| Payments | Stripe (live mode keys once ready; test mode for staging) |
| Email | Resend |
| Background jobs (future) | Redis — Upstash works well with serverless |

None of these need to be the same provider. Mixing (e.g. Supabase for
Postgres + R2 for storage + Stripe + Resend) is normal and fine.

## 2. Environments

Run at least two environments before production:

- **Staging** — a separate Postgres database, Stripe *test mode* keys, a
  separate S3 bucket/prefix. This is where you run the E2E suite
  (`tests/e2e/`) and where `npm run db:seed` is safe to use.
- **Production** — live Stripe keys, its own database, no seed data ever.

## 3. Database

```bash
# Generate the Prisma client (needs real network access to
# binaries.prisma.sh — see tests/e2e/README.md if this fails in a
# restricted network environment)
npx prisma generate

# Apply the schema to a fresh database
npx prisma migrate deploy

# Staging only — never run against production
npm run db:seed
```

`prisma migrate deploy` (not `migrate dev`) is the production-safe
command — it applies existing migrations without prompting or generating
new ones.

## 4. Environment variables

Set every variable from `.env.example` in your hosting provider's
environment configuration — never commit a `.env` file. At minimum for a
working deployment:

- `DATABASE_URL`, `AUTH_SECRET` (hard requirements — the app won't boot
  cleanly without these, see `src/lib/env.ts`)
- `NEXTAUTH_URL` — your production URL
- `AI_PROVIDER` + `AI_API_KEY` — for the estimator and document analysis
  to work
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` — for file
  uploads and deliverables
- `RESEND_API_KEY` — for the email leg of notifications (the app still
  works without it; email notifications just won't send, see
  `docs/ARCHITECTURE.md` §15)

Everything else has a sane default or degrades gracefully when unset
(see `isAiConfigured()`, `isStripeConfigured()`, etc. in `src/lib/env.ts`
— every integration checks its own configuration rather than assuming).

## 5. Stripe webhook

After deploying, register a webhook endpoint in the Stripe Dashboard
pointing at `https://your-domain.com/api/webhooks/stripe`, subscribed to
at minimum: `checkout.session.completed`, `payment_intent.payment_failed`,
`charge.refunded`. Copy the resulting signing secret into
`STRIPE_WEBHOOK_SECRET`.

## 6. Deploy

**Vercel** (recommended, zero-config for Next.js):

```bash
vercel --prod
```

Set environment variables in the Vercel project settings before the
first deploy, or the build will fail at the `env.ts` validation step.

**Any other Node host** (Railway, Fly.io, a plain VPS with PM2, etc.):

```bash
npm run build
npm run start
```

The app has no dependency on Vercel-specific features (no Edge Runtime
requirements, no Vercel KV/Blob usage) — it runs on any Node 18.18+ host.

## 7. Post-deploy checklist

- [ ] `npx prisma migrate deploy` ran successfully against production
- [ ] Stripe webhook endpoint registered and `STRIPE_WEBHOOK_SECRET` set
- [ ] Test a full checkout in Stripe test mode against staging before
      switching production to live keys
- [ ] Confirm `/api-docs` and `/trust` render correctly (no missing env
      var crashes)
- [ ] Confirm `robots.txt` and `sitemap.xml` are reachable at the
      production domain
- [ ] Rotate `AUTH_SECRET` to a value never used in development —
      it's also the MFA secret-encryption key (see ARCHITECTURE.md §17),
      so treat it as a real production secret, not a placeholder

## 8. What's NOT covered by this deploy process

Per `docs/ROADMAP.md`, these still need work regardless of how well the
deploy goes:
- No CI pipeline is configured yet (no `.github/workflows/`) — the test
  commands (`npm test`, `npm run test:e2e`) are ready to wire into one.
- No blue/green or canary deploy strategy — a straightforward single-
  environment cutover is assumed.
- No automated database backup strategy is configured — set this up with
  your Postgres provider's native backup tooling (all the providers
  listed above support point-in-time recovery).
