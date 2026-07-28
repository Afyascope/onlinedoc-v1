import { auth } from "@/lib/auth";
import { db } from "@/db";
import { consultations, consultationStatusHistory, consultationNotes, consultationFiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { PatientConsultationDetailClient } from "./client";

export default async function ConsultationDetailPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const consultationRows = userId
    ? await db.select().from(consultations).where(eq(consultations.id, params.id)).limit(1)
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

  const notesRows = await db
    .select()
    .from(consultationNotes)
    .where(eq(consultationNotes.consultationId, params.id))
    .orderBy(desc(consultationNotes.createdAt));

  const files = await db
    .select()
    .from(consultationFiles)
    .where(eq(consultationFiles.consultationId, params.id))
    .orderBy(desc(consultationFiles.createdAt));

  return (
    <PatientConsultationDetailClient
      consultation={consultation}
      statusHistory={statusHistory}
      notes={notesRows}
      files={files}
      role={session?.user?.role as "patient" | "clinician"}
    />
  );
}
