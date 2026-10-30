import postgres from "postgres";
import { applyMigrations, applyTestDatabaseEnvironment } from "../test-db/support.mjs";

const databaseUrl = applyTestDatabaseEnvironment("LOCAL_AUTH_TEST_DATABASE_URL");
process.env.NODE_ENV = "test";

const target = new URL(databaseUrl);
const sql = postgres(databaseUrl, { ssl: "require", max: 1, connect_timeout: 10 });
let db;

try {
  const [schema] = await sql`
    select
      to_regclass('public.user') is not null as has_user,
      to_regclass('public.account') is not null as has_account
  `;
  if (!schema?.has_user || !schema?.has_account) {
    await applyMigrations(sql);
  }

  ({ db } = await import("../db/index.ts"));
  const { provisionLocalAuthUsers } = await import("../test-db/fixtures/local-auth-users.mjs");
  const users = await provisionLocalAuthUsers(db);

  console.log(`Provisioned ${users.length} local synthetic auth users in ${target.hostname}:${target.port || 5432}${target.pathname}.`);
  console.log(`Accounts: ${users.map((user) => user.email).join(", ")}`);
  console.log("The fixture password is documented in next/README.md. It never applies to production.");
} finally {
  if (db?.$client) await db.$client.end({ timeout: 1 }).catch(() => undefined);
  await sql.end({ timeout: 1 }).catch(() => undefined);
}
