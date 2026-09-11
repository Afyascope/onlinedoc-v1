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

Uses Neon PostgreSQL (managed). No local PostgreSQL instance needed.

```bash
# Push schema to database
npx drizzle-kit push

# Seed with test data
curl -X POST http://localhost:3000/api/seed
```

The development seed endpoint requires `SEED_ADMIN_PASSWORD`,
`SEED_CLINICIAN_PASSWORD`, and `SEED_PATIENT_PASSWORD`. These variables must
never be configured in production.

## Development

```bash
npm run dev
```

Open http://localhost:3000

## Health Check

```bash
curl http://localhost:3000/api/health
```

Returns `{"status":"healthy","database":"connected","latency":"...","timestamp":"..."}`

## Architecture

```
Neon PostgreSQL → single DATABASE_URL → shared Drizzle instance → Better Auth + Server Actions + Dashboards
```

- One `postgres` client (pooled, max 10 connections)
- One `drizzle` instance (shared across all modules)
- Global singleton via `globalThis` for hot-reload safety
- No manual database startup required

## Migration Workflow

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Apply migration
npx drizzle-kit migrate

# Push schema directly (development)
npx drizzle-kit push
```
