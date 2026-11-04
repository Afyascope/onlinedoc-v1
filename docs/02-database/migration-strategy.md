# Database Migration Strategy

## Purpose

This document defines how database schema changes are managed throughout the lifecycle of OnlineDoc.

---

# Principles

- Every schema change must be version controlled.
- Schema changes should be repeatable.
- Production databases must never be modified manually.
- Migrations should be reversible whenever possible.

---

# Migration History

The migration history lives in `next/drizzle/` and is managed by Drizzle Kit.

- `0000_baseline.sql` is the single baseline migration that represents the
  current production schema. It was generated from `next/db/schema.ts` and
  verified byte-for-byte against the production catalog.
- Future schema changes are captured as new numbered migrations
  (`0001_…`, `0002_…`, …) generated with `npm run migrate:generate`.
- `0001_bumpy_stardust.sql` adds the clinical catalogue, consultation snapshot
  tables, prescription provenance columns, History Notes, and domain/lifecycle
  CHECK constraints.
- `0002_nifty_adam_warlock.sql` adds the free-text `notes` column to
  `catalogue_resources`.
- `0003_steep_nomad.sql` adds a partial unique index enforcing at most one
  active release per catalogue domain.

Do not edit or delete an applied migration file. Do not re-run the baseline
against the existing production database.

---

# Current Neon Ledger State

The shared Neon PostgreSQL 17 database (`neondb`) is treated as production for
migration purposes. A read-only audit on 2026-10-28 confirmed:

- `drizzle.__drizzle_migrations` contains **one row**: the `0000` baseline.
- Baseline hash:
  `ce867c5ad28d42d90e47d200d4af68f4ca06cefe5f60871c92088cbcc473c9d3`.
- Baseline journal timestamp: `1789141993924`.
- `0001_bumpy_stardust.sql`, `0002_nifty_adam_warlock.sql`, and
  `0003_steep_nomad.sql` are **pending and unapplied**.

Earlier documentation reported an empty ledger. That is stale. Do not insert
the baseline again and do not delete the existing row. Deleting it would make a
future migration run replay the baseline `CREATE TABLE` statements against
existing tables.

---

# Development

During development, schema changes should be applied through migration files.

1. Edit `next/db/schema.ts`.
2. Generate a migration:

   ```
   npm run migrate:generate
   ```

3. Review the generated SQL in `next/drizzle/`.
4. Apply it to a disposable local PostgreSQL database, never the shared Neon
   database:

   ```
   npm run migrate
   ```

5. Validate:

   ```
   npm run migrate:validate
   ```

Local development uses the shared Neon database for application runtime.
Applying pending migrations to it is a production-equivalent change, not routine
development. Use a disposable local database for migration iteration.

`drizzle-kit push` is prohibited for the shared Neon database. It bypasses the
Drizzle migration ledger and can alter or drop shared application and Strapi
tables. Use `npm run migrate` only through the production approval gate.

---

# Testing

All migrations should be tested before deployment.

A migration should be applied to a clean PostgreSQL 17 database to verify
correctness.

1. Create an empty local PostgreSQL 17 database.
2. Run `npm run migrate` against it.
3. Confirm the resulting schema matches `next/db/schema.ts`.
4. Run `npm test`.
5. Run the catalogue integration suite against a separate disposable local
   database:

   ```
   CATALOGUE_TEST_DATABASE_URL=postgres://user@127.0.0.1:5432/catalogue_test npm run test:db
   ```

The integration suite resets the `public` schema and refuses non-local hosts or
database names that do not contain `test`. Never point it at production or a
shared database.

The catalogue migrations were verified on PostgreSQL 17.11 from a clean
database, and `npm run migrate` applied all four journal entries successfully.
This clean-database rehearsal does not satisfy the production backup or approval
requirements.

---

# Production / Shared Neon

The baseline is already recorded in Neon. Migrations `0001`–`0003` are pending.
Before applying them to the shared Neon database:

- Create and verify a restorable backup (currently **not verified** — see
  `production-readiness.md`; a documented requirement is not a working backup).
- Confirm point-in-time recovery and retention in the Neon dashboard.
- Confirm restricted restore credentials and a recorded isolated restore test.
- Review the migration changes and application compatibility.
- Re-check that the ledger contains only the baseline row and that `0001`–`0003`
  are absent.
- Obtain **explicit written approval** naming migrations `0001`–`0003`, with the
  approver, date, and change/ticket ID. Approval must follow backup verification;
  code review alone is not approval.
- Use a maintenance window or write freeze for the DDL.

Apply only with `npm run migrate` from `next/`. Never use `drizzle-kit push`
against the shared Neon database; it bypasses the ledger and can alter shared
application and Strapi tables. Never re-run the baseline.

The detailed preflight, backup/restore, approval, and post-migration verification
steps are in `production-readiness.md`.

---

# Rollback

If a migration introduces unexpected issues:

- Restore the latest backup if necessary.
- Apply the rollback procedure where supported.
- Document the incident before creating a replacement migration.

---

# Version Control

Migration files are part of the repository.

Every migration should have a clear, descriptive name that reflects its purpose.
