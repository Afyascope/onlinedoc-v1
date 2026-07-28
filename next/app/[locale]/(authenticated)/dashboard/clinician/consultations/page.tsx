import { auth } from "@/lib/auth";
import { db } from "@/db";
import { consultations, consultationStatusHistory } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { headers } from "next/headers";
import { ClinicianConsultationsClient } from "./client";

export default async function ClinicianConsultationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const all = userId
    ? await db.select().from(consultations)
        .where(eq(consultations.clinicianId, userId))
        .orderBy(desc(consultations.createdAt))
    : [];

  const unassigned = await db.select().from(consultations)
    .where(and(eq(consultations.status, "paid")))
    .orderBy(desc(consultations.createdAt));

  return <ClinicianConsultationsClient consultations={all} unassigned={unassigned} clinicianId={userId || ""} />;
}
