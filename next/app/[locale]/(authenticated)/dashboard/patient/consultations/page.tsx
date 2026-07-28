import { auth } from "@/lib/auth";
import { db } from "@/db";
import { consultations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { PatientConsultationsClient } from "./client";

export default async function ConsultationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const list = userId
    ? await db.select().from(consultations).where(eq(consultations.patientId, userId)).orderBy(desc(consultations.createdAt))
    : [];

  return <PatientConsultationsClient consultations={list} />;
}
