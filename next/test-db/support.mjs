import { readFile } from "node:fs/promises";

const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const PRODUCTION_HOST_PATTERNS = [
  /(^|\.)neon\.tech$/,
  /(^|\.)neon\.build$/,
  /-pooler\./,
  /(^|\.)supabase\.(co|com)$/,
  /\.rds\.amazonaws\.com$/,
  /(^|\.)render\.com$/,
  /(^|\.)railway\.app$/,
  /(^|\.)fly\.dev$/,
  /(^|\.)azure\.com$/,
];

function productionLikeHost(hostname) {
  return PRODUCTION_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

/**
 * Resolve an explicitly configured test database. This never falls back to
 * DATABASE_URL, so a missing test variable cannot silently select production.
 */
export function resolveTestDatabaseUrl(variableName, env = process.env) {
  const raw = env?.[variableName];
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new Error(
      `${variableName} is required for database tests. ` +
        "Use a disposable local PostgreSQL database; DATABASE_URL is never used as a fallback.",
    );
  }

  const value = raw.trim();
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} must be a valid PostgreSQL URL.`);
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(`${variableName} must use the postgres or postgresql protocol.`);
  }

  const hostname = url.hostname.toLowerCase();
  if (productionLikeHost(hostname)) {
    throw new Error(`${variableName} points at a production-like host (${hostname}). Refusing to run tests.`);
  }
  if (!LOCAL_HOSTNAMES.has(hostname)) {
    throw new Error(
      `${variableName} must target localhost or 127.0.0.1 (received ${hostname}). ` +
        "Refusing to connect to a non-local database.",
    );
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  if (!databaseName) {
    throw new Error(`${variableName} must include a database name.`);
  }
  if (!/test/i.test(databaseName)) {
    throw new Error(
      `${variableName} must target a database whose name contains "test" (received ${databaseName}).`,
    );
  }

  return value;
}

/** Apply the verified test URL to the process environment used by app modules. */
export function applyTestDatabaseEnvironment(variableName, env = process.env) {
  const databaseUrl = resolveTestDatabaseUrl(variableName, env);
  env.DATABASE_URL = databaseUrl;
  return databaseUrl;
}

export async function resetTestSchema(sql) {
  await sql.unsafe("DROP SCHEMA public CASCADE");
  await sql.unsafe("CREATE SCHEMA public");
}

export async function applyMigrations(sql, root = new URL("../", import.meta.url)) {
  const journal = JSON.parse(await readFile(new URL("drizzle/meta/_journal.json", root), "utf8"));
  for (const entry of journal.entries) {
    const content = await readFile(new URL(`drizzle/${entry.tag}.sql`, root), "utf8");
    for (const raw of content.split("--> statement-breakpoint")) {
      const statement = raw.trim();
      if (statement) await sql.unsafe(statement);
    }
  }
}
