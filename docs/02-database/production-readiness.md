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

1. Take and verify a PostgreSQL backup first. Do not proceed without one.
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

## Backups

Backups are not configured by this repository and must not be represented as
available until the operator confirms them. The production owner should
configure managed PostgreSQL point-in-time recovery plus daily encrypted full
backups, retain daily backups for 30 days and monthly backups for 12 months,
and restrict restore credentials to the infrastructure owner and designated
on-call engineer. At least monthly, restore into an isolated database, run the
health check and migration validation, and record the result.
