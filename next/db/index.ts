import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { describeDatabaseTarget, sanitizeDatabaseError } from "@/lib/db/errors";
import { configureDatabaseNetworking } from "@/lib/db/network";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  queryClient?: ReturnType<typeof postgres>;
  db?: ReturnType<typeof drizzle>;
  diagnosticStarted?: boolean;
  networkConfigured?: ReturnType<typeof configureDatabaseNetworking>;
};

if (!globalForDb.networkConfigured) {
  globalForDb.networkConfigured = configureDatabaseNetworking();
}

if (!globalForDb.queryClient) {
  globalForDb.queryClient = postgres(process.env.DATABASE_URL!, {
    ssl: "require",
    connect_timeout: 10,
    // Vercel may run many function instances. Keep each instance to one
    // connection so a direct Neon endpoint cannot be exhausted by scaling.
    max: 1,
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
    console.info(JSON.stringify({ event: "database.startup.diagnostic.started", startedAt: new Date(startedAt).toISOString(), config: describeDatabaseTarget(process.env.DATABASE_URL), network: globalForDb.networkConfigured, postgres: { ssl: "require", connect_timeout: 10, idle_timeout: 30, max: 1 } }));
    try {
      const result = await db.execute(sql`SELECT 1 AS connected, current_database() AS database, current_user AS user, version() AS version`);
      const completedAt = Date.now();
      const row = result[0] as { connected?: number; database?: string; user?: string; version?: string } | undefined;
      console.info(JSON.stringify({ event: "database.startup.diagnostic.succeeded", completedAt: new Date(completedAt).toISOString(), durationMs: completedAt - startedAt, tcpTlsAuthenticationAndSql: "completed", connected: row?.connected, currentDatabase: row?.database, currentUser: row?.user, version: row?.version }));
    } catch (error) {
      const completedAt = Date.now();
      console.error(JSON.stringify({ event: "database.startup.diagnostic.failed", completedAt: new Date(completedAt).toISOString(), durationMs: completedAt - startedAt, error: sanitizeDatabaseError(error) }));
    }
  })();
}
