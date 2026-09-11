import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { queryClient?: ReturnType<typeof postgres>; db?: ReturnType<typeof drizzle>; diagnosticStarted?: boolean };

function databaseUrlDiagnostics() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return { present: false };
  try {
    const url = new URL(raw);
    const passwordMasked = url.password.length > 0;
    url.password = passwordMasked ? "***" : "";
    return {
      present: true,
      url: url.toString(),
      host: url.hostname,
      port: Number(url.port || 5432),
      sslmode: url.searchParams.get("sslmode"),
      pooledEndpoint: /-pooler\./i.test(url.hostname),
      passwordMasked,
    };
  } catch (error) {
    return { present: true, parseError: error instanceof Error ? error.message : String(error) };
  }
}

function databaseError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack, code: (error as Error & { code?: string }).code, ...Object.fromEntries(Object.entries(error)) };
  }
  return { value: error };
}

if (!globalForDb.queryClient) {
  globalForDb.queryClient = postgres(process.env.DATABASE_URL!, {
    ssl: "require",
    connect_timeout: 10,
    max: 10,
    idle_timeout: 30,
    max_lifetime: 300,
  });
}
const queryClient = globalForDb.queryClient;

if (!globalForDb.db) {
  globalForDb.db = drizzle(queryClient, { schema });
}
export const db = globalForDb.db;

if (process.env.NODE_ENV !== "test" && process.env.NEXT_PHASE !== "phase-production-build" && !globalForDb.diagnosticStarted) {
  globalForDb.diagnosticStarted = true;
  void (async () => {
    const startedAt = Date.now();
    console.info(JSON.stringify({ event: "database.startup.diagnostic.started", startedAt: new Date(startedAt).toISOString(), config: databaseUrlDiagnostics(), postgres: { ssl: "require", connect_timeout: 10, idle_timeout: 30, max: 10 } }));
    try {
      const result = await db.execute(sql`SELECT 1 AS connected, current_database() AS database, current_user AS user, version() AS version`);
      const completedAt = Date.now();
      const row = result[0] as { connected?: number; database?: string; user?: string; version?: string } | undefined;
      console.info(JSON.stringify({ event: "database.startup.diagnostic.succeeded", completedAt: new Date(completedAt).toISOString(), durationMs: completedAt - startedAt, tcpTlsAuthenticationAndSql: "completed", connected: row?.connected, currentDatabase: row?.database, currentUser: row?.user, version: row?.version }));
    } catch (error) {
      const completedAt = Date.now();
      console.error(JSON.stringify({ event: "database.startup.diagnostic.failed", completedAt: new Date(completedAt).toISOString(), durationMs: completedAt - startedAt, error: databaseError(error) }));
    }
  })();
}
