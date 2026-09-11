import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const start = Date.now();
    const result = await db.execute(sql`SELECT 1 AS ok`);
    const latency = Date.now() - start;

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      latency: `${latency}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({
      status: "unhealthy",
      database: "disconnected",
      error: e?.message || "Unknown database error",
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
