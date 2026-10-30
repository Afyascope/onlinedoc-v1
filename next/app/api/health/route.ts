import { db } from "@/db";
import { sanitizeDatabaseError } from "@/lib/db/errors";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1 AS ok`);
    const latency = Date.now() - start;

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      latency: `${latency}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const safeError = sanitizeDatabaseError(error);
    console.error(JSON.stringify({ event: "health.database.failed", error: safeError, timestamp: new Date().toISOString() }));
    return NextResponse.json({
      status: "unhealthy",
      database: "disconnected",
      error: safeError.message,
      code: safeError.code,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
