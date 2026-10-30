export interface DocumentPerson {
  name: string;
  email?: string | null;
  identifier?: string | null;
}

export interface DocumentConsultation {
  id: string;
  title: string;
  consultationType: string;
  status: string;
  createdAt: Date | string;
  completedAt: Date | string | null;
  followUpDate?: string | null;
  symptoms?: string | null;
  durationOfIllness?: string | null;
  medicalHistory?: string | null;
}

export interface DocumentNotes {
  historyNotes?: string | null;
  diagnosis?: string | null;
  advice?: string | null;
  followUpDate?: string | null;
}

export interface DiagnosisDocumentItem {
  nameSnapshot: string;
  codeSnapshot?: string | null;
  codingSystemSnapshot?: string | null;
  codingSystemVersionSnapshot?: string | null;
  notes?: string | null;
  sourceSnapshot?: string | null;
  releaseVersionSnapshot?: string | null;
}

export interface RequestDocumentItem {
  nameSnapshot: string;
  codeSnapshot?: string | null;
  categorySnapshot?: string | null;
  modalitySnapshot?: string | null;
  notes?: string | null;
  sourceSnapshot?: string | null;
  releaseVersionSnapshot?: string | null;
}

export interface PrescriptionDocumentItem {
  medication: string;
  dosage: string;
  dosageForm?: string | null;
  frequency: string;
  duration?: string | null;
  route?: string | null;
  instructions?: string | null;
  strengthSnapshot?: string | null;
  genericNameSnapshot?: string | null;
  brandNameSnapshot?: string | null;
  sourceSnapshot?: string | null;
  releaseVersionSnapshot?: string | null;
}

export interface ClinicianDocumentInfo extends DocumentPerson {
  specialization?: string | null;
  qualifications?: string | null;
}

export interface PrescriptionDocument {
  kind: "prescription";
  title: string;
  patient: DocumentPerson;
  clinician: ClinicianDocumentInfo | null;
  consultation: DocumentConsultation;
  items: PrescriptionDocumentItem[];
}

export interface RequestDocument {
  kind: "laboratory" | "radiology";
  title: string;
  patient: DocumentPerson;
  clinician: ClinicianDocumentInfo | null;
  consultation: DocumentConsultation;
  items: RequestDocumentItem[];
}

export interface ClinicalReportDocument {
  kind: "report";
  title: string;
  patient: DocumentPerson;
  clinician: ClinicianDocumentInfo | null;
  consultation: DocumentConsultation;
  notes: DocumentNotes | null;
  diagnoses: DiagnosisDocumentItem[];
  laboratory: RequestDocumentItem[];
  radiology: RequestDocumentItem[];
  prescriptions: PrescriptionDocumentItem[];
  clinicalSummary: string;
}

export interface FacesheetDocument {
  kind: "facesheet";
  title: string;
  patient: DocumentPerson;
  clinician: ClinicianDocumentInfo | null;
  consultation: DocumentConsultation;
  notes: DocumentNotes | null;
  diagnoses: DiagnosisDocumentItem[];
  laboratory: RequestDocumentItem[];
  radiology: RequestDocumentItem[];
  prescriptions: PrescriptionDocumentItem[];
}

export type ClinicalDocument =
  | PrescriptionDocument
  | RequestDocument
  | ClinicalReportDocument
  | FacesheetDocument;

export function clinicalSummaryFromNotes(notes: DocumentNotes | null | undefined): string {
  if (!notes?.historyNotes) return "";
  return notes.historyNotes.trim();
}

export function buildPrescriptionDocument(input: {
  patient: DocumentPerson;
  clinician: ClinicianDocumentInfo | null;
  consultation: DocumentConsultation;
  items: PrescriptionDocumentItem[];
}): PrescriptionDocument {
  return {
    kind: "prescription",
    title: "Prescription",
    patient: input.patient,
    clinician: input.clinician,
    consultation: input.consultation,
    items: input.items,
  };
}

export function buildRequestDocument(input: {
  kind: "laboratory" | "radiology";
  patient: DocumentPerson;
  clinician: ClinicianDocumentInfo | null;
  consultation: DocumentConsultation;
  items: RequestDocumentItem[];
}): RequestDocument {
  const title = input.kind === "laboratory" ? "Laboratory Request Form" : "Radiology Request Form";
  return {
    kind: input.kind,
    title,
    patient: input.patient,
    clinician: input.clinician,
    consultation: input.consultation,
    items: input.items,
  };
}

export function buildClinicalReportDocument(input: {
  patient: DocumentPerson;
  clinician: ClinicianDocumentInfo | null;
  consultation: DocumentConsultation;
  notes: DocumentNotes | null;
  diagnoses: DiagnosisDocumentItem[];
  laboratory: RequestDocumentItem[];
  radiology: RequestDocumentItem[];
  prescriptions: PrescriptionDocumentItem[];
}): ClinicalReportDocument {
  return {
    kind: "report",
    title: "Complete Clinical Report",
    patient: input.patient,
    clinician: input.clinician,
    consultation: input.consultation,
    notes: input.notes,
    diagnoses: input.diagnoses,
    laboratory: input.laboratory,
    radiology: input.radiology,
    prescriptions: input.prescriptions,
    clinicalSummary: clinicalSummaryFromNotes(input.notes),
  };
}

export function buildFacesheetDocument(input: {
  patient: DocumentPerson;
  clinician: ClinicianDocumentInfo | null;
  consultation: DocumentConsultation;
  notes: DocumentNotes | null;
  diagnoses: DiagnosisDocumentItem[];
  laboratory: RequestDocumentItem[];
  radiology: RequestDocumentItem[];
  prescriptions: PrescriptionDocumentItem[];
}): FacesheetDocument {
  return {
    kind: "facesheet",
    title: "Medical Facesheet",
    patient: input.patient,
    clinician: input.clinician,
    consultation: input.consultation,
    notes: input.notes,
    diagnoses: input.diagnoses,
    laboratory: input.laboratory,
    radiology: input.radiology,
    prescriptions: input.prescriptions,
  };
}

export function documentItemCounts(input: {
  prescriptions: unknown[];
  laboratory: unknown[];
  radiology: unknown[];
}): { hasPrescriptionItems: boolean; hasLaboratoryItems: boolean; hasRadiologyItems: boolean } {
  return {
    hasPrescriptionItems: input.prescriptions.length > 0,
    hasLaboratoryItems: input.laboratory.length > 0,
    hasRadiologyItems: input.radiology.length > 0,
  };
}

export function documentFileName(kind: ClinicalDocument["kind"], consultationId: string): string {
  const prefix: Record<ClinicalDocument["kind"], string> = {
    prescription: "onlinedoc-prescription",
    laboratory: "onlinedoc-laboratory-request",
    radiology: "onlinedoc-radiology-request",
    report: "onlinedoc-clinical-report",
    facesheet: "onlinedoc-medical-facesheet",
  };
  return `${prefix[kind]}-${consultationId.slice(0, 8)}.pdf`;
}
