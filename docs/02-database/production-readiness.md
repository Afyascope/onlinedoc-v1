# Production Database Readiness

## Current State (audited)

The Next application uses Drizzle (`drizzle-orm` + `drizzle-kit`) against a
Neon PostgreSQL 17 database named `neondb`.

A read-only audit compared three sources and found:

| Source | State |
| --- | --- |
| `next/db/schema.ts` | 20 application tables (authoritative application schema) |
| `next/drizzle/` migration history | Was stale: `0000`/`0001`/`0002` described an old 12-table schema (old `consultations` shape, USD defaults) that no longer matched production |
| Production `public` schema | 20 tables, structurally matching `schema.ts` |
| Production `drizzle.__drizzle_migrations` ledger | Present but **empty** (0 rows) |

The production schema is the authoritative starting point. The stale migration
files could not truthfully represent it, so they were replaced with a single
baseline migration generated from the current `schema.ts`.

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

## Migration Baseline

The single migration file `next/drizzle/0000_baseline.sql` is the baseline for
the current production schema. Its Drizzle ledger hash is:

```
ce867c5ad28d42d90e47d200d4af68f4ca06cefe5f60871c92088cbcc473c9d3
```

The journal timestamp (`when`) is `1789141993924`.

## Existing Database Procedure (production reconciliation)

The production schema already exists, so the baseline SQL must **not** be
re-executed against it. Instead, the baseline is recorded as "already applied"
with a metadata-only insert into the Drizzle ledger. This does not touch any
application table or data and is reversible.

1. Take and verify a PostgreSQL backup first (see "Backup and Restore
   Readiness"). This precondition is **not yet satisfied**; do not proceed
   without a verified, restorable backup.
2. Verify the ledger table exists:

   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations';
   ```

3. Record the baseline as applied (metadata only — no DDL, no data change):

   ```sql
   INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
   VALUES ('ce867c5ad28d42d90e47d200d4af68f4ca06cefe5f60871c92088cbcc473c9d3', 1789141993924);
   ```

   To reverse this decision later (metadata only):

   ```sql
   DELETE FROM drizzle.__drizzle_migrations
   WHERE hash = 'ce867c5ad28d42d90e47d200d4af68f4ca06cefe5f60871c92088cbcc473c9d3';
   ```

4. Confirm the ledger is reconciled:

   ```sql
   SELECT id, hash, created_at FROM drizzle.__drizzle_migrations;
   ```

5. After reconciliation, `npm run migrate` (in `next/`) applies only future
   unapplied migrations. It must never re-run the baseline against production.

## Fresh Database Procedure

1. Create an empty PostgreSQL database.
2. Set `DATABASE_URL` to it and run, from `next/`:

   ```
   npm run migrate
   ```

3. Verify 20 tables were created and the journal contains `0000_baseline`.
4. Run typecheck, build, and the migration/security checks.

## Migration Commands

Run all commands from the `next/` directory.

| Intent | Command |
| --- | --- |
| Generate a new migration from `db/schema.ts` | `npm run migrate:generate` |
| Apply pending migrations | `npm run migrate` |
| Validate repository migration files (no destructive SQL) | `npm run migrate:validate` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Build | `npm run build` |

### Prohibited in production

- `drizzle-kit push` (schema push) — never run against production.
- `drizzle-kit migrate` before the baseline has been recorded as applied
  (running it would attempt to replay `CREATE TABLE` on existing tables).
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
- The application schema (20 tables) and the Drizzle baseline are correct and
  reproduce production exactly (see "Current State").

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
   before any production reconciliation step.

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

### Conditions required before baseline reconciliation

The metadata-only baseline insert (see "Existing Database Procedure") must be
run **only after all of the following are true**:

1. A real production backup has been created **and** verified restorable into an
   isolated database.
2. Point-in-time recovery and retention are confirmed in the Neon dashboard.
3. Restore credentials are restricted and documented.
4. A restore test has passed and the result is recorded.

Until those conditions are met, the production Drizzle ledger must remain empty
and the baseline insert must not be executed.
