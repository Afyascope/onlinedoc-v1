import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { loadTsModule } from "./helpers/load-ts.mjs";

const root = new URL("../", import.meta.url);
const authorization = loadTsModule(new URL("lib/catalogue/authorization.ts", root));
const documents = loadTsModule(new URL("lib/catalogue/documents/data.ts", root));

const baseAccess = {
  userId: "patient-1",
  patientId: "patient-1",
  clinicianId: "clinician-1",
  hasPrescriptionItems: true,
  hasLaboratoryItems: true,
  hasRadiologyItems: true,
};

test("only administrators may administer catalogues", () => {
  assert.equal(authorization.canAdministerCatalogues("admin"), true);
  assert.equal(authorization.canAdministerCatalogues("clinician"), false);
  assert.equal(authorization.canAdministerCatalogues("patient"), false);
  assert.equal(authorization.canAdministerCatalogues(null), false);
});

test("clinicians and administrators may search catalogues; patients may not", () => {
  assert.equal(authorization.canSearchClinicianCatalogue("clinician"), true);
  assert.equal(authorization.canSearchClinicianCatalogue("admin"), true);
  assert.equal(authorization.canSearchClinicianCatalogue("patient"), false);
  assert.equal(authorization.canSearchClinicianCatalogue(undefined), false);
});

test("patients may download only populated prescription, laboratory and radiology documents", () => {
  assert.equal(authorization.canAccessConsultationDocument({ ...baseAccess, role: "patient", documentType: "prescription" }), true);
  assert.equal(authorization.canAccessConsultationDocument({ ...baseAccess, role: "patient", documentType: "laboratory" }), true);
  assert.equal(authorization.canAccessConsultationDocument({ ...baseAccess, role: "patient", documentType: "radiology" }), true);
  assert.equal(authorization.canAccessConsultationDocument({ ...baseAccess, role: "patient", documentType: "report" }), false);
  assert.equal(authorization.canAccessConsultationDocument({ ...baseAccess, role: "patient", documentType: "facesheet" }), false);
});

test("empty patient documents are not accessible", () => {
  const empty = { ...baseAccess, role: "patient", hasPrescriptionItems: false, hasLaboratoryItems: false, hasRadiologyItems: false };
  for (const documentType of ["prescription", "laboratory", "radiology"]) {
    assert.equal(authorization.canAccessConsultationDocument({ ...empty, documentType }), false);
  }
});

test("patients cannot access another patient's consultation documents", () => {
  assert.equal(authorization.canAccessConsultationDocument({
    ...baseAccess,
    role: "patient",
    userId: "other-patient",
    documentType: "prescription",
  }), false);
});

test("only the assigned clinician may access clinician documents", () => {
  for (const documentType of ["prescription", "laboratory", "radiology", "report", "facesheet"]) {
    assert.equal(authorization.canAccessConsultationDocument({
      ...baseAccess,
      role: "clinician",
      userId: "clinician-1",
      documentType,
    }), true);
    assert.equal(authorization.canAccessConsultationDocument({
      ...baseAccess,
      role: "clinician",
      userId: "clinician-2",
      documentType,
    }), false);
  }
});

test("administrators and unauthenticated users cannot use patient/clinician document access", () => {
  assert.equal(authorization.canAccessConsultationDocument({ ...baseAccess, role: "admin", documentType: "report" }), false);
  assert.equal(authorization.canAccessConsultationDocument({ ...baseAccess, role: "patient", userId: null, documentType: "prescription" }), false);
  assert.equal(authorization.canAccessConsultationDocument({ ...baseAccess, role: null, userId: "patient-1", documentType: "prescription" }), false);
});

test("Clinical Summary is derived only from clinician History Notes", () => {
  assert.equal(documents.clinicalSummaryFromNotes({ historyNotes: "  History text  " }), "History text");
  assert.equal(documents.clinicalSummaryFromNotes({ diagnosis: "Should not be used" }), "");
  assert.equal(documents.clinicalSummaryFromNotes(null), "");
});

test("document item counts drive patient document availability", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(documents.documentItemCounts({ prescriptions: [], laboratory: [], radiology: [] }))), {
    hasPrescriptionItems: false,
    hasLaboratoryItems: false,
    hasRadiologyItems: false,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(documents.documentItemCounts({ prescriptions: [1], laboratory: [1, 2], radiology: [1] }))), {
    hasPrescriptionItems: true,
    hasLaboratoryItems: true,
    hasRadiologyItems: true,
  });
});

test("document filenames are deterministic and do not include patient data", () => {
  assert.equal(documents.documentFileName("prescription", "abcdef12-3456"), "onlinedoc-prescription-abcdef12.pdf");
  assert.equal(documents.documentFileName("report", "abcdef12-3456"), "onlinedoc-clinical-report-abcdef12.pdf");
});

test("admin catalogue actions all enforce the server-side admin guard", async () => {
  const source = await readFile(new URL("lib/actions/catalogue-admin.ts", root), "utf8");
  assert.match(source, /getAdminSession\(\)/);
  assert.match(source, /assertAdminRole\(session\.user\.role\)/);
  const guardedFunctions = [...source.matchAll(/export async function (\w+)/g)].map((match) => match[1]);
  const guardCalls = [...source.matchAll(/await getAdminSession\(\)/g)];
  assert.ok(guardedFunctions.length >= 10);
  assert.equal(guardCalls.length, guardedFunctions.length);
  assert.ok(guardedFunctions.length > 0);
});

test("clinician search action and API require authentication and role authorization", async () => {
  const action = await readFile(new URL("lib/actions/catalogue.ts", root), "utf8");
  const route = await readFile(new URL("app/api/catalogue/search/route.ts", root), "utf8");
  assert.match(action, /auth\.api\.getSession/);
  assert.match(action, /canSearchClinicianCatalogue\(session\.user\.role\)/);
  assert.match(action, /getClinicianStatus\(session\.user\) !== "APPROVED"/);
  assert.match(route, /auth\.api\.getSession/);
  assert.match(route, /canSearchClinicianCatalogue\(session\.user\.role\)/);
  assert.match(route, /status: 401/);
  assert.match(route, /status: 403/);
});

test("document route enforces item presence and server-side access rules", async () => {
  const route = await readFile(new URL("app/api/documents/consultation/[id]/[type]/route.ts", root), "utf8");
  assert.match(route, /isPatientVisibleDocumentType\(documentType\) && !itemCount/);
  assert.match(route, /canAccessConsultationDocument\(/);
  assert.match(route, /status: 401/);
  assert.match(route, /status: 403/);
  assert.match(route, /status: 404/);
});
