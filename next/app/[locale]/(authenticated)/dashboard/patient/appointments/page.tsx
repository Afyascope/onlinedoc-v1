import { auth } from "@/lib/auth";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { PatientAppointmentsClient } from "./client";

export default async function AppointmentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const list = userId
    ? await db.select().from(appointments).where(eq(appointments.patientId, userId)).orderBy(desc(appointments.date))
    : [];

  return <PatientAppointmentsClient appointments={list} userId={userId ?? ""} />;
}
