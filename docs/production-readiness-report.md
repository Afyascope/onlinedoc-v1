# OnlineDoc Production Readiness Report

## Demo and Test Data Cleanup Report

### Development-only data

- The guarded Next `/api/seed` route and its generated users/records.
- `strapi/data/export_20250116105447.tar.gz` and the Strapi seed command.
- `next/public/uploads/*` and the local Strapi upload fixtures.

### Production-inappropriate data

- Seed credentials and demo identities must not be configured in production.
- `strapi/public/uploads/upload_test_11310d3d5d.pdf` and
  `phase91test_ab12cd34.pdf` require removal or quarantine during the content
  migration window.

### Legitimate CMS content

- Published pages, products, blog articles, images, and dynamic-zone content
  in the Strapi export require content-owner confirmation before migration.

### Manual review required

- Existing sample users, clinical records, payment records, and product files.
- Any existing local upload whose product ownership is not known.

Nothing in this report was deleted or reset during the readiness phase.

## Implementation Summary

### Security and authorization

- Registration roles are server-defaulted to `patient`; administrator and
  clinician provisioning remains server-side.
- Clinician consultation detail, status changes, clinical notes, completion,
  patient lookup, history, and communication links require assignment.
- Patient order, payment, consultation, notification, and download operations
  are scoped to the authenticated user and paid entitlement.
- `/api/seed` returns 404 in production and development credentials are
  environment-only.
- Preview and revalidation endpoints reject missing secrets.

### Payments

- Marketplace and consultation checkout values come from authoritative server
  records/configuration.
- Paystack reference, amount, currency, status, and ownership are independently
  verified before fulfilment.
- Duplicate webhook fulfilment is gated by a conditional database update and
  unique payment references.
- Refunds are not marked locally because a Paystack refund API integration is
  not present.

### Storage and configuration

- Product downloads use private R2 server-side reads in production and never
  return raw file URLs to the client.
- Strapi production is fail-closed unless PostgreSQL, explicit CORS, and the
  private R2 upload provider are configured.
- Next production builds no longer suppress TypeScript or ESLint failures.

## Database Changes

No production database changes were executed.

The production PostgreSQL database (Neon `neondb`, PostgreSQL 17) was audited
read-only. It contains 20 application tables in `public` plus Neon's own
`neon_auth.*` tables. The application tables match `next/db/schema.ts`. The
Drizzle ledger table `drizzle.__drizzle_migrations` exists but contains zero
rows.

The stale `0000`/`0001`/`0002` migration files (an old 12-table schema) were
replaced with a single baseline migration `next/drizzle/0000_baseline.sql`
generated from `schema.ts` and verified identical to the production catalog
(288 catalog objects, zero differences). Two schema-code corrections were made
so `schema.ts` models production exactly: the `user.approved_by` self-FK and
the four marketplace `uniqueIndex()` declarations.

Reconciling the production ledger is a metadata-only insert (one row into
`drizzle.__drizzle_migrations`) and is documented, with its exact hash and SQL,
in `docs/02-database/production-readiness.md`. It is intentionally left as an
operator step to run only after a backup is verified.

## Required Environment

Set the variables in `next/.env.example` and `strapi/.env.example` with real
production values, especially URLs, Better Auth secrets, preview/revalidation
secrets, PostgreSQL, Paystack TEST keys, SMTP, Strapi token, explicit CORS,
and R2 credentials. Keep Paystack TEST keys until a separately approved LIVE
change. The actual production frontend and API domains are intentionally not
hardcoded because they were not supplied.

## Backup Status

Not configured or independently verified in this repository. The required
frequency, retention, restore, ownership, and verification process is defined
in `docs/02-database/production-readiness.md`.

## Validation Status

- PASS: Next TypeScript check, ESLint, production build, migration-file validation, and 7 targeted static security tests.
- PASS: Strapi build with complete production-shaped placeholder configuration.
- PASS: Read-only PostgreSQL connectivity and schema inspection.
- PASS: Live production seed guard returned HTTP 404.
- PASS: Live invalid Paystack signature returned HTTP 401.
- NOT TESTED: authenticated multi-user integration attacks, because no disposable test database/session fixture was configured.
- NOT TESTED: live Paystack amount/currency/reference mismatch and duplicate-webhook flows, because no Paystack test transaction fixture was available.
- NOT TESTED: authorized/unauthorized R2 download and raw-object exposure, because production R2 credentials and migrated objects are not configured locally.

## Remaining Blockers

1. Reconcile the production Drizzle ledger: after a verified backup, record the
   baseline hash (`ce867c5ad28d42d90e47d200d4af68f4ca06cefe5f60871c92088cbcc473c9d3`)
   as applied using the metadata-only insert in `docs/02-database/production-readiness.md`.
2. Configure and verify PostgreSQL backups and restore testing.
3. Provision the private R2 bucket, migrate/validate product objects, and confirm the Strapi R2 provider and media proxy with real objects.
4. Supply actual production frontend/API origins, secrets, SMTP, Strapi token, and CORS values.
5. Execute the missing authenticated, Paystack, and R2 integration tests in a disposable environment.
6. Manually review and clean the demo/test data listed above after explicit approval.
7. Review the dependency audit before release: `npm audit --omit=dev` reports 27 vulnerabilities, including high-severity advisories in Next.js, Nodemailer, sharp, and transitive packages; the full audit reports 33. `npm audit fix --force` was not run because it proposes breaking upgrades.

## Deployment Sequence

1. Create and verify a PostgreSQL backup; do not deploy yet.
2. Compare the target schema with the Drizzle baseline and reconcile the ledger
   using the metadata-only procedure in `docs/02-database/production-readiness.md`.
3. Configure private R2 and migrate product files without exposing the bucket.
4. Configure all production environment variables with Paystack TEST keys and exact frontend CORS origins.
5. Run the complete validation suite, including the currently untested integration cases.
6. Build Next and Strapi from the reviewed commit; inspect logs for secrets or patient data.
7. Deploy the Dockerized Strapi backend and verify health, CMS access, PostgreSQL, CORS, and private downloads.
8. Deploy the Vercel frontend and verify authentication, ownership, TEST checkout, webhook retries, email, and CMS content.
9. Monitor the first TEST transactions and backup verification before requesting a separate LIVE-key approval.
