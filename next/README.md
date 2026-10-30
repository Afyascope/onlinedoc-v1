# LaunchPad — Digital Health Platform

Next.js digital health platform with consultations, marketplace, and multi-role dashboards.

## Prerequisites

- Node.js 18.17+
- PostgreSQL-compatible database (Neon PostgreSQL recommended)

## Setup

```bash
cd next
npm install
```

## Environment Variables

Create `.env` (see `.env.example`):

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@ep-xxxxx.aws.neon.tech/neondb?sslmode=require

# Better Auth
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:3000

# Strapi
NEXT_PUBLIC_API_URL=http://localhost:1337

# Paystack (Test)
PAYSTACK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_CURRENCY=KES
```

## Database

Uses the shared Neon PostgreSQL database (managed). No local PostgreSQL
instance is needed for the application, but migration changes must follow the
database migration policy.

```bash
# Apply pending migrations (only after backup verification and approval)
npm run migrate

# Validate repository migration files
npm run migrate:validate

# Seed with test data
curl -X POST http://localhost:3000/api/seed
```

> **Do not run `npx drizzle-kit push` against the shared Neon database.** It
> bypasses the Drizzle migration ledger and can alter or drop shared application
> and Strapi tables. Migrations `0001`–`0003` require a verified, restorable
> backup and explicit written approval; see
> [`../docs/02-database/production-readiness.md`](../docs/02-database/production-readiness.md).

The development seed endpoint requires `SEED_ADMIN_PASSWORD`,
`SEED_CLINICIAN_PASSWORD`, and `SEED_PATIENT_PASSWORD`. These variables must
never be configured in production.

## Local Development Database

Local development uses the existing database connection from `next/.env`
(typically Neon), so the normal development account is available without
switching connections. `next/.env.development` must not define `DATABASE_URL`;
it only contains local-only auth, URL, and mock-email overrides. Production
builds and `next start` do not load `.env.development`.

Do not export `DATABASE_URL` in your shell for local work: process-level values
take precedence over the env files.

Automated authentication and catalogue tests use dedicated disposable local
PostgreSQL databases instead. Their URLs are required explicitly and are never
derived from `DATABASE_URL`:

```bash
cd next
unset DATABASE_URL

# Required only by the fixture/test scripts; they never fall back to DATABASE_URL.
export LOCAL_AUTH_TEST_DATABASE_URL=postgres://127.0.0.1:55432/catalogue_auth_test
export CATALOGUE_TEST_DATABASE_URL=postgres://127.0.0.1:55432/catalogue_test

npm run seed:local-auth
npm run test:auth
npm run test:db
npm run dev
```

The local development startup diagnostic must report the expected Neon host
from `.env`, never `127.0.0.1:55432` or a `catalogue_auth_test` database.

The fixture provisions these accounts with Better Auth's own password hasher:

| Email | Role | Test password |
| --- | --- | --- |
| `admin@example.test` | admin | `LocalTestOnly!2026` |
| `clinician@example.test` | clinician (approved) | `LocalTestOnly!2026` |
| `patient@example.test` | patient | `LocalTestOnly!2026` |

The fixture safely resets stale password hashes in the guarded test database on
every run. It is never imported by production application code.

Automated database tests fail closed when their dedicated test URL is missing,
non-local, or not named as a test database. Starting `npm run dev` does not run
migrations, seed users, reset schemas, or delete records.

Do not commit production credentials to local env files or test fixtures.

## Development

```bash
npm run dev
```

Local development loads `.env` and the non-database overrides from
`.env.development`; production is unaffected. Start the disposable PostgreSQL
instance only when running the guarded local integration tests.

Open http://localhost:3000

## Health Check

```bash
curl http://localhost:3000/api/health
```

Returns `{"status":"healthy","database":"connected","latency":"...","timestamp":"..."}`

## Architecture

```
Local development Neon DATABASE_URL / production DATABASE_URL / guarded local test URL → shared Drizzle instance → Better Auth + Server Actions + Dashboards
```

- One `postgres` client (max 1 connection per serverless instance)
- One `drizzle` instance (shared across all modules)
- Global singleton via `globalThis` for hot-reload safety
- No manual database startup required

## Migration Workflow

Run these commands from `next/`.

```bash
# Generate a migration from schema changes
npm run migrate:generate

# Apply pending migrations only after the backup/approval gate
npm run migrate

# Validate repository migration files
npm run migrate:validate
```

`drizzle-kit push` is not supported for this project. The shared Neon database
also contains Strapi tables, and push bypasses the Drizzle migration ledger.
