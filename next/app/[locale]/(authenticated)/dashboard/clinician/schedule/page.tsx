import { auth } from "@/lib/auth";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { ClinicianScheduleClient } from "./client";

export default async function SchedulePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const list = userId
    ? await db.select().from(appointments).where(eq(appointments.clinicianId, userId)).orderBy(desc(appointments.date))
    : [];

  return <ClinicianScheduleClient appointments={list} />;
}
