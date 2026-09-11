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

Do not edit or delete an applied migration file. Do not re-run the baseline
against the existing production database.

---

# Development

During development, schema changes should be applied through migration files.

1. Edit `next/db/schema.ts`.
2. Generate a migration:

   ```
   npm run migrate:generate
   ```

3. Review the generated SQL in `next/drizzle/`.
4. Apply it to the local database:

   ```
   npm run migrate
   ```

5. Validate:

   ```
   npm run migrate:validate
   ```

Developers should keep local databases synchronized with the latest migrations.

---

# Testing

All migrations should be tested before deployment.

A migration should be applied to a clean database to verify correctness.

1. Create an empty local PostgreSQL database.
2. Run `npm run migrate` against it.
3. Confirm the resulting schema matches `next/db/schema.ts`.

---

# Production

Before applying any migration:

- Create and verify a database backup (currently **not configured** — see
  `production-readiness.md`; a documented requirement is not a verified backup).
- Review migration changes.
- Verify compatibility with the current application version.
- Ensure the baseline has already been recorded as applied (see
  `production-readiness.md`). Never re-run the baseline against the existing
  production schema.

Production reconciliation of the baseline is a metadata-only ledger insert
documented in `production-readiness.md`. It does not execute any DDL or modify
any application data.

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
