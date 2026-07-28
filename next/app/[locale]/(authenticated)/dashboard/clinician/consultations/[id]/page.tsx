import { auth } from "@/lib/auth";
import { db } from "@/db";
import { consultations, consultationStatusHistory, consultationNotes, consultationFiles, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { ClinicianConsultationDetailClient } from "./client";

export default async function ClinicianConsultationDetailPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const consultationRows = userId
    ? await db.select().from(consultations).where(eq(consultations.id, params.id)).limit(1)
    : [];

  if (consultationRows.length === 0) {
    return <div className="p-8 text-center text-neutral-500">Consultation not found.</div>;
  }

  const c = consultationRows[0];

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

  const patient = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, c.patientId))
    .limit(1);

  const canAssign = !c.clinicianId || c.clinicianId === userId;

  return (
    <ClinicianConsultationDetailClient
      consultation={c}
      statusHistory={statusHistory}
      notes={notesRows}
      files={files}
      patient={patient[0] || null}
      userId={userId || ""}
      canAssign={canAssign}
    />
  );
}
