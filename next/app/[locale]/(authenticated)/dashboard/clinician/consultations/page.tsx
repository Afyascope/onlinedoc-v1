import { auth } from "@/lib/auth";
import { db } from "@/db";
import { consultations } from "@/db/schema";
import { eq, desc, and, isNull, isNotNull } from "drizzle-orm";
import { headers } from "next/headers";
import { ClinicianConsultationsClient } from "./client";
import { requireApprovedClinician } from "@/lib/clinician-access";

export default async function ClinicianConsultationsPage() {
  await requireApprovedClinician();
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const all = userId
    ? await db.select().from(consultations)
        .where(eq(consultations.clinicianId, userId))
        .orderBy(desc(consultations.createdAt))
    : [];

  const unassigned = await db.select({
    id: consultations.id,
    title: consultations.title,
    consultationType: consultations.consultationType,
    status: consultations.status,
    createdAt: consultations.createdAt,
    paidAt: consultations.paidAt,
  }).from(consultations).where(and(
    eq(consultations.status, "paid"),
    isNull(consultations.clinicianId),
    isNotNull(consultations.paidAt)
  )).orderBy(desc(consultations.paidAt));

  return <ClinicianConsultationsClient consultations={all} unassigned={unassigned} />;
}
