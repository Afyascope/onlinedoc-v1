import type { DocumentType } from "./domains";

export function canAdministerCatalogues(role: string | null | undefined): boolean {
  return role === "admin";
}

export function canSearchClinicianCatalogue(role: string | null | undefined): boolean {
  return role === "clinician" || role === "admin";
}

export interface DocumentAccessInput {
  role: string | null | undefined;
  userId: string | null | undefined;
  patientId: string;
  clinicianId: string | null;
  documentType: DocumentType;
  hasPrescriptionItems: boolean;
  hasLaboratoryItems: boolean;
  hasRadiologyItems: boolean;
}

const PATIENT_DOCUMENT_TYPES: DocumentType[] = ["prescription", "laboratory", "radiology"];

export function canAccessConsultationDocument(input: DocumentAccessInput): boolean {
  if (!input.userId) return false;

  if (input.role === "patient") {
    if (input.userId !== input.patientId) return false;
    if (!PATIENT_DOCUMENT_TYPES.includes(input.documentType)) return false;
    if (input.documentType === "prescription") return input.hasPrescriptionItems;
    if (input.documentType === "laboratory") return input.hasLaboratoryItems;
    if (input.documentType === "radiology") return input.hasRadiologyItems;
    return false;
  }

  if (input.role === "clinician") {
    if (!input.clinicianId || input.userId !== input.clinicianId) return false;
    return true;
  }

  return false;
}

export function isPatientVisibleDocumentType(type: DocumentType): boolean {
  return PATIENT_DOCUMENT_TYPES.includes(type);
}
