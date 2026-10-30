import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, asc, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  clinicianProfiles,
  consultationDiagnoses,
  consultationDocuments,
  consultationNotes,
  consultationRequests,
  consultations,
  prescriptions,
  user,
} from "@/db/schema";
import { canAccessConsultationDocument, isPatientVisibleDocumentType } from "@/lib/catalogue/authorization";
import { isDocumentType, type DocumentType } from "@/lib/catalogue/domains";
import {
  buildClinicalReportDocument,
  buildFacesheetDocument,
  buildPrescriptionDocument,
  buildRequestDocument,
  documentFileName,
  documentItemCounts,
  type ClinicianDocumentInfo,
  type DocumentNotes,
  type DocumentPerson,
  type PrescriptionDocumentItem,
  type RequestDocumentItem,
  type DiagnosisDocumentItem,
  type ClinicalDocument,
} from "@/lib/catalogue/documents/data";
import { renderClinicalDocument } from "@/lib/catalogue/documents/pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string; type: string } },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDocumentType(params.type)) return NextResponse.json({ error: "Unknown document type" }, { status: 404 });

  const documentType = params.type as DocumentType;

  const [consultation] = await db.select().from(consultations).where(eq(consultations.id, params.id)).limit(1);
  if (!consultation) return NextResponse.json({ error: "Consultation not found" }, { status: 404 });

  const [patient] = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, consultation.patientId))
    .limit(1);

  let clinician: ClinicianDocumentInfo | null = null;
  if (consultation.clinicianId) {
    const [clinicianUser] = await db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(eq(user.id, consultation.clinicianId))
      .limit(1);
    const [profile] = await db
      .select({ specialization: clinicianProfiles.specialization, qualifications: clinicianProfiles.qualifications })
      .from(clinicianProfiles)
      .where(eq(clinicianProfiles.userId, consultation.clinicianId))
      .limit(1);
    if (clinicianUser) {
      clinician = {
        name: clinicianUser.name,
        email: clinicianUser.email,
        specialization: profile?.specialization ?? null,
        qualifications: profile?.qualifications ?? null,
      };
    }
  }

  const [diagnoses, requests, prescriptionRows] = await Promise.all([
    db.select().from(consultationDiagnoses).where(eq(consultationDiagnoses.consultationId, consultation.id)).orderBy(asc(consultationDiagnoses.sortOrder)),
    db.select().from(consultationRequests).where(eq(consultationRequests.consultationId, consultation.id)).orderBy(asc(consultationRequests.sortOrder)),
    db.select().from(prescriptions).where(and(eq(prescriptions.consultationId, consultation.id))).orderBy(asc(prescriptions.sortOrder)),
  ]);

  const laboratoryRows = requests.filter((row) => row.domain === "laboratory");
  const radiologyRows = requests.filter((row) => row.domain === "radiology");
  const counts = documentItemCounts({
    prescriptions: prescriptionRows,
    laboratory: laboratoryRows,
    radiology: radiologyRows,
  });

  const itemCount = documentType === "prescription"
    ? counts.hasPrescriptionItems
    : documentType === "laboratory"
      ? counts.hasLaboratoryItems
      : documentType === "radiology"
        ? counts.hasRadiologyItems
        : true;

  if (isPatientVisibleDocumentType(documentType) && !itemCount) {
    return NextResponse.json({ error: "Document not available" }, { status: 404 });
  }

  const allowed = canAccessConsultationDocument({
    role: session.user.role,
    userId: session.user.id,
    patientId: consultation.patientId,
    clinicianId: consultation.clinicianId,
    documentType,
    ...counts,
  });
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let notes: DocumentNotes | null = null;
  if (!isPatientVisibleDocumentType(documentType)) {
    const [notesRow] = await db
      .select()
      .from(consultationNotes)
      .where(eq(consultationNotes.consultationId, consultation.id))
      .orderBy(desc(consultationNotes.createdAt))
      .limit(1);
    notes = notesRow ? {
      historyNotes: notesRow.historyNotes,
      diagnosis: notesRow.diagnosis,
      advice: notesRow.advice,
      followUpDate: notesRow.followUpDate,
    } : null;
  }

  const patientInfo: DocumentPerson = {
    name: patient?.name ?? "Patient",
    email: patient?.email ?? null,
    identifier: consultation.patientId.slice(0, 8),
  };
  const patientConsultationInfo = {
    id: consultation.id,
    title: consultation.title,
    consultationType: consultation.consultationType,
    status: consultation.status,
    createdAt: consultation.createdAt,
    completedAt: consultation.completedAt,
    followUpDate: consultation.followUpDate,
  };
  const consultationInfo = {
    ...patientConsultationInfo,
    symptoms: consultation.symptoms,
    durationOfIllness: consultation.durationOfIllness,
    medicalHistory: consultation.medicalHistory,
  };
  const diagnosisItems: DiagnosisDocumentItem[] = diagnoses.map((row) => ({
    nameSnapshot: row.nameSnapshot,
    codeSnapshot: row.codeSnapshot,
    codingSystemSnapshot: row.codingSystemSnapshot,
    codingSystemVersionSnapshot: row.codingSystemVersionSnapshot,
    notes: row.notes,
    sourceSnapshot: row.sourceSnapshot,
    releaseVersionSnapshot: row.releaseVersionSnapshot,
  }));
  const toRequestItem = (row: typeof consultationRequests.$inferSelect): RequestDocumentItem => ({
    nameSnapshot: row.nameSnapshot,
    codeSnapshot: row.codeSnapshot,
    categorySnapshot: row.categorySnapshot,
    modalitySnapshot: row.modalitySnapshot,
    notes: row.notes,
    sourceSnapshot: row.sourceSnapshot,
    releaseVersionSnapshot: row.releaseVersionSnapshot,
  });
  const toPatientRequestItem = (row: typeof consultationRequests.$inferSelect): RequestDocumentItem => ({
    ...toRequestItem(row),
    notes: null,
  });
  const prescriptionItems: PrescriptionDocumentItem[] = prescriptionRows.map((row) => ({
    medication: row.medication,
    dosage: row.dosage,
    dosageForm: row.dosageForm,
    frequency: row.frequency,
    duration: row.duration,
    route: row.route,
    instructions: row.instructions,
    strengthSnapshot: row.strengthSnapshot,
    genericNameSnapshot: row.genericNameSnapshot,
    brandNameSnapshot: row.brandNameSnapshot,
    sourceSnapshot: row.sourceSnapshot,
    releaseVersionSnapshot: row.releaseVersionSnapshot,
  }));

  let document: ClinicalDocument;
  if (documentType === "prescription") {
    document = buildPrescriptionDocument({
      patient: patientInfo,
      clinician,
      consultation: patientConsultationInfo,
      items: prescriptionItems,
    });
  } else if (documentType === "laboratory") {
    document = buildRequestDocument({
      kind: "laboratory",
      patient: patientInfo,
      clinician,
      consultation: patientConsultationInfo,
      items: laboratoryRows.map(toPatientRequestItem),
    });
  } else if (documentType === "radiology") {
    document = buildRequestDocument({
      kind: "radiology",
      patient: patientInfo,
      clinician,
      consultation: patientConsultationInfo,
      items: radiologyRows.map(toPatientRequestItem),
    });
  } else if (documentType === "report") {
    document = buildClinicalReportDocument({
      patient: patientInfo,
      clinician,
      consultation: consultationInfo,
      notes,
      diagnoses: diagnosisItems,
      laboratory: laboratoryRows.map(toRequestItem),
      radiology: radiologyRows.map(toRequestItem),
      prescriptions: prescriptionItems,
    });
  } else {
    document = buildFacesheetDocument({
      patient: patientInfo,
      clinician,
      consultation: consultationInfo,
      notes,
      diagnoses: diagnosisItems,
      laboratory: laboratoryRows.map(toRequestItem),
      radiology: radiologyRows.map(toRequestItem),
      prescriptions: prescriptionItems,
    });
  }

  const bytes = await renderClinicalDocument(document);
  const checksum = crypto.createHash("sha256").update(Buffer.from(bytes)).digest("hex");
  await db.insert(consultationDocuments).values({
    id: crypto.randomUUID(),
    consultationId: consultation.id,
    documentType,
    generatedBy: session.user.id,
    generatedAt: new Date(),
    checksum,
    metadata: {
      itemCount,
      prescriptionCount: prescriptionRows.length,
      laboratoryCount: laboratoryRows.length,
      radiologyCount: radiologyRows.length,
    },
  }).catch(() => undefined);

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${documentFileName(documentType, consultation.id)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
