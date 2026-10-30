# Production Database Readiness

## Current State (latest read-only audit, 2026-10-28)

The Next application uses Drizzle (`drizzle-orm` + `drizzle-kit`) against a
shared Neon PostgreSQL 17 database named `neondb`. The database is shared with
Strapi and is treated as production for migration purposes.

A read-only audit compared the sources and found:

| Source | State |
| --- | --- |
| `next/db/schema.ts` | 26 application tables (20 existing + 6 catalogue/snapshot tables) |
| `next/drizzle/` migration history | `0000_baseline.sql` matches the audited 20-table application schema. `0001_bumpy_stardust.sql`, `0002_nifty_adam_warlock.sql`, and `0003_steep_nomad.sql` are new, unapplied catalogue migrations. |
| Production `public` schema | 20 application tables; shared Strapi tables are also present. The catalogue migration has **not** been applied. |
| Production `drizzle.__drizzle_migrations` ledger | **1 row**: the `0000` baseline is recorded. `0001`–`0003` are absent. |

The production schema is the authoritative starting point. The stale migration
files could not truthfully represent it, so they were replaced with a single
baseline migration generated from the current `schema.ts`.

### Corrected ledger status

An earlier version of this document reported that the production ledger was
empty. That statement is stale. The latest read-only audit confirmed:

```
table:  drizzle.__drizzle_migrations
rows:   1
hash:   ce867c5ad28d42d90e47d200d4af68f4ca06cefe5f60871c92088cbcc473c9d3
when:   1789141993924
```

The baseline is already reconciled. Do **not** insert it again, and do **not**
delete the existing ledger row. A duplicate insert would create an inconsistent
ledger; deleting the row would make a future migration run replay the baseline
against existing tables.

Two schema-code corrections were made so `schema.ts` faithfully models
production before generating the baseline:

1. `user.approved_by` gained the self-referencing foreign key
   `user_approved_by_user_id_fk` that exists in production.
2. The four marketplace unique objects (`downloads.order_item_id`,
   `orders.payment_reference`, `orders.paystack_reference`,
   `payments.paystack_reference`) are declared with `uniqueIndex()` so the
   baseline emits `CREATE UNIQUE INDEX` — matching production, where they were
   created as standalone unique indexes rather than table unique constraints.

The generated baseline was applied to a fresh local database and its catalog
(tables, columns, types, nullability, defaults, primary keys, foreign keys,
unique constraints, and indexes) was diffed against production. The result was
**identical** (288 catalog objects, zero differences).

## Catalogue Migration Status

`0001_bumpy_stardust.sql`, `0002_nifty_adam_warlock.sql`, and
`0003_steep_nomad.sql` add the clinical catalogue and structured consultation
record. They are additive and do not modify or delete existing production
tables.

The baseline is already recorded. Migrations `0001`–`0003` are pending and must
not be applied until a verified, restorable backup exists and explicit written
approval has been recorded. After all three migrations are applied, production
will have 26 application tables and four ledger rows.

The full migration chain was verified on a clean PostgreSQL 17.11 database:
`npm run migrate` applied all four journal entries, and the catalogue
integration suite passed with `npm run test:db`. That clean-database rehearsal
does not satisfy the production backup or approval requirements below.

## Migration Baseline (recorded)

The single migration file `next/drizzle/0000_baseline.sql` is the baseline for
the current production schema. Its Drizzle ledger hash is:

```
ce867c5ad28d42d90e47d200d4af68f4ca06cefe5f60871c92088cbcc473c9d3
```

The journal timestamp (`when`) is `1789141993924`.

The baseline is already recorded in Neon as ledger row `id=1`. Do not insert it
again and do not delete the row.

## Baseline Reconciliation (completed)

The production schema already existed, so the baseline SQL was not executed.
The baseline was previously recorded as "already applied" with a metadata-only
ledger insert. That reconciliation is complete and must not be repeated.

A read-only audit confirmed the ledger contains exactly the baseline row. No
application table or data was changed by the reconciliation.

Do not run the historical baseline insert again. A duplicate row creates an
inconsistent ledger. Do not delete the baseline row either: without it, a future
migration run would attempt to replay the baseline `CREATE TABLE` statements
against existing tables and fail.

If a different environment does not have the baseline recorded, stop. Do not
manually insert or delete ledger rows until a verified backup exists and the
change has explicit approval.

## Fresh Database Procedure

1. Create an empty PostgreSQL database.
2. Set `DATABASE_URL` to it and run, from `next/`:

   ```
   npm run migrate
   ```

3. Verify 26 tables were created and the journal contains `0000_baseline`,
   `0001_bumpy_stardust`, `0002_nifty_adam_warlock`, and `0003_steep_nomad`.
4. Run typecheck, build, and the migration/security checks.
5. Run the catalogue integration suite against a separate disposable database:
   `CATALOGUE_TEST_DATABASE_URL=... npm run test:db`.

## Migration Commands

Run all commands from the `next/` directory.

| Intent | Command |
| --- | --- |
| Generate a new migration from `db/schema.ts` | `npm run migrate:generate` |
| Apply pending migrations (only after the mandatory gate) | `npm run migrate` |
| Validate repository migration files (no destructive SQL) | `npm run migrate:validate` |
| Run pure unit/contract tests | `npm test` |
| Run catalogue integration tests (local disposable DB) | `npm run test:db` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Build | `npm run build` |

### Prohibited against the shared Neon database

These prohibitions apply to the shared Neon database used by local development
as well as production.

- `drizzle-kit push` (schema push) — **never run it**. It bypasses the Drizzle
  migration ledger and can alter or drop shared application and Strapi tables.
  Use `npm run migrate` only after the approval gate below.
- `npm run migrate` before a verified, restorable backup exists and explicit
  written approval has been recorded for `0001`–`0003`.
- Re-running the baseline migration or manually inserting/deleting the baseline
  ledger row.
- `DROP TABLE`, `DROP DATABASE`, `TRUNCATE`, `DROP SCHEMA`, or any destructive
  synchronization.
- Manually editing the production schema outside the migration workflow.
- Editing or re-running an already-applied historical migration file.

## Rollback / Recovery

- Migrations are forward-only. `npm run migrate:validate` fails the build if a
  forward migration contains `DROP TABLE`, `TRUNCATE`, or `DROP SCHEMA`.
- To undo a bad schema change, write a new forward migration that reverses it;
  never edit or delete an applied migration file.
- For full recovery, restore from the managed PostgreSQL backup into an
  isolated database, validate, and switch the connection only after approval.

## Backup and Restore Readiness

### Verified

- The production database is a Neon PostgreSQL 17 instance (`neondb`).
- The connection is configured only through `DATABASE_URL`
  (`next/drizzle.config.ts`, `next/db/index.ts`, `strapi/config/database.ts`).
- The existing 20-table application schema and the Drizzle baseline are correct
  and reproduce production exactly (see "Current State").
- The catalogue migrations are additive and were verified on a clean
  PostgreSQL 17.11 database. They have not been applied to production yet.

That is the full extent of what is verified. **No production backup has been
created or verified as part of this work.**

### Not verified / not configured in this repository

The repository provides **no backup or restore mechanism** of its own. There
are no `pg_dump`/`pg_restore` scripts, no backup cron, no retention
configuration, no restore runbook, and no CI/CD backup job
(`.github/workflows/deploy-demo.yaml` only triggers a GitLab Strapi image
build). A requirement is documented; that is not the same as a working backup.

Neon account-level settings are not visible from this repository and require
operator verification in the Neon dashboard.

| Backup policy item | Status |
| --- | --- |
| PostgreSQL point-in-time recovery | REQUIRES OPERATOR ACTION — Neon offers managed PITR/branching, but its enablement and retention must be confirmed in the Neon dashboard |
| Automated daily backups | NOT VERIFIED |
| Encrypted backups | NOT VERIFIED |
| 30-day daily retention | NOT VERIFIED |
| 12-month monthly retention | NOT VERIFIED |
| Restricted restore credentials | NOT VERIFIED |
| Monthly isolated restore verification | NOT CONFIGURED (no restore test has ever been recorded) |
| A real, verified production backup exists | NOT VERIFIED — no evidence |

### Operator actions required

1. In the Neon dashboard, enable and record **point-in-time recovery**
   retention for the production project, and note the retention window.
2. Establish a **logical backup** schedule (e.g. daily `pg_dump`) with encrypted
   storage, or confirm an equivalent managed snapshot schedule.
3. Configure **restore credentials** separate from the application connection,
   restricted to the infrastructure owner and on-call engineer.
4. Perform and record a **restore test** into an isolated database (below)
   before applying migrations `0001`–`0003`.

### Safe backup procedure (logical)

Run from a machine with `pg_dump` 17+ and network access to the production
database. Do not store the backup next to the database or in the application
repo.

```bash
pg_dump "$DATABASE_URL" \
  --no-owner --no-privileges \
  --format=custom \
  --file=onlinedoc_prod_$(date -u +%Y%m%dT%H%M%SZ).dump
```

Verify the dump is non-empty and can be read back:

```bash
pg_restore --list onlinedoc_prod_*.dump | head
```

Encrypt before transport/storage and record the checksum.

### Safe isolated restore procedure

Never restore over the live production database. Restore into either (a) a new
Neon branch created from a point in time, or (b) a separate throwaway database.

For a logical-dump restore into an isolated database:

```bash
createdb onlinedoc_restore_test
pg_restore --no-owner --no-privileges --dbname onlinedoc_restore_test onlinedoc_prod_*.dump
```

Then validate the restored database against `next/db/schema.ts` and the current
production schema:

1. Confirm the object count matches the known-good catalog (288 catalog objects:
   20 tables, their columns, primary keys, 27 foreign keys, unique constraints,
   and indexes).
2. Spot-check row counts for each domain:
   - Better Auth: `user`, `session`, `account`, `verification`
   - Consultation: `consultations`, `consultation_notes`,
     `consultation_status_history`, `consultation_files`
   - Commerce: `orders`, `order_items`, `downloads`, `payments`
   - Marketplace/administration: `audit_logs`, `platform_settings`,
     `clinician_profiles`, `appointments`, `medical_records`, `prescriptions`,
     `notifications`, `settings`
3. Point the application at the isolated database (read-only) and run the health
   check (`GET /api/health`) and `npm run migrate:validate`.

### Mandatory gate before migrations 0001–0003

Migrations `0001`–`0003` must **not** be applied to the shared Neon database
until all of the following are true. This is a mandatory gate, not a
recommendation.

1. A real backup of the shared Neon database has been created **and** verified
   restorable into an isolated database or Neon branch.
2. Point-in-time recovery and retention are confirmed in the Neon dashboard.
3. Restore credentials are restricted and documented.
4. A restore test has passed and the result is recorded.
5. Explicit written approval has been recorded with the approver, date, and
   change/ticket ID. The approval must name migrations `0001`–`0003` and must be
   given after backup verification. Code review alone is not approval.
6. A read-only preflight confirms the ledger contains exactly the baseline row,
   `0001`–`0003` are absent, and the expected catalogue/history objects are
   still missing.
7. A maintenance window or write freeze is in place for the DDL.

Then apply only the pending migrations with `npm run migrate` from `next/`.
Never use `drizzle-kit push`. Verify the ledger has four rows, the application
schema has 26 tables, and the new columns and partial unique index exist. Record
the result before closing the change.

If any condition is missing, stop and do not run the migration.
