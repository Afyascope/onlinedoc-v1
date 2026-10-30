import { auth } from "@/lib/auth";
import { db } from "@/db";
import { consultations, consultationStatusHistory, consultationFiles, consultationRequests, prescriptions } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { PatientConsultationDetailClient } from "./client";

export default async function ConsultationDetailPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const consultationRows = userId
    ? await db.select({
        id: consultations.id,
        patientId: consultations.patientId,
        clinicianId: consultations.clinicianId,
        title: consultations.title,
        consultationType: consultations.consultationType,
        status: consultations.status,
        fee: consultations.fee,
        completedAt: consultations.completedAt,
        followUpDate: consultations.followUpDate,
        createdAt: consultations.createdAt,
      }).from(consultations).where(eq(consultations.id, params.id)).limit(1)
    : [];

  if (consultationRows.length === 0) {
    return <div className="p-8 text-center text-neutral-500">Consultation not found.</div>;
  }

  const consultation = consultationRows[0];

  if (consultation.patientId !== userId && consultation.clinicianId !== userId) {
    return <div className="p-8 text-center text-neutral-500">Access denied.</div>;
  }

  const statusHistory = await db
    .select()
    .from(consultationStatusHistory)
    .where(eq(consultationStatusHistory.consultationId, params.id))
    .orderBy(desc(consultationStatusHistory.createdAt));

  const files = await db
    .select()
    .from(consultationFiles)
    .where(eq(consultationFiles.consultationId, params.id))
    .orderBy(desc(consultationFiles.createdAt));

  const [prescriptionDocument, laboratoryDocument, radiologyDocument] = await Promise.all([
    db.select({ id: prescriptions.id })
      .from(prescriptions)
      .where(eq(prescriptions.consultationId, params.id))
      .limit(1),
    db.select({ id: consultationRequests.id })
      .from(consultationRequests)
      .where(and(
        eq(consultationRequests.consultationId, params.id),
        eq(consultationRequests.domain, "laboratory"),
      ))
      .limit(1),
    db.select({ id: consultationRequests.id })
      .from(consultationRequests)
      .where(and(
        eq(consultationRequests.consultationId, params.id),
        eq(consultationRequests.domain, "radiology"),
      ))
      .limit(1),
  ]);

  return (
    <PatientConsultationDetailClient
      consultation={consultation}
      statusHistory={statusHistory}
      files={files}
      hasPrescriptionDocument={prescriptionDocument.length > 0}
      hasLaboratoryDocument={laboratoryDocument.length > 0}
      hasRadiologyDocument={radiologyDocument.length > 0}
    />
  );
}
