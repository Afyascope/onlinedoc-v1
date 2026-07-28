import { auth } from "@/lib/auth";
import { db } from "@/db";
import { medicalRecords } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { PatientRecordsClient } from "./client";

export default async function RecordsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const list = userId
    ? await db.select().from(medicalRecords).where(eq(medicalRecords.patientId, userId)).orderBy(desc(medicalRecords.recordDate))
    : [];

  return <PatientRecordsClient records={list} />;
}
