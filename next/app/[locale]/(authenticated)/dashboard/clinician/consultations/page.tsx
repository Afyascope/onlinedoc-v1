import { auth } from "@/lib/auth";
import { db } from "@/db";
import { consultations, consultationStatusHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
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

  return <ClinicianConsultationsClient consultations={all} unassigned={[]} clinicianId={userId || ""} />;
}
