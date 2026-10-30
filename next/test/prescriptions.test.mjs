import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { loadTsModule } from "./helpers/load-ts.mjs";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");
const frequency = loadTsModule(new URL("lib/prescriptions/frequency.ts", root));
const display = loadTsModule(new URL("lib/prescriptions/display.ts", root));

test("new prescriptions accept only standardized frequency values", () => {
  for (const option of frequency.PRESCRIPTION_FREQUENCY_OPTIONS) {
    assert.equal(frequency.isSupportedPrescriptionFrequency(option.value), true);
    assert.equal(frequency.parseNewPrescriptionFrequency(` ${option.value} `), option.value);
    assert.equal(frequency.prescriptionFrequencyLabel(option.value), option.label);
  }
  assert.equal(frequency.isSupportedPrescriptionFrequency("once a day"), false);
  assert.throws(
    () => frequency.parseNewPrescriptionFrequency("once a day"),
    /Prescription frequency must be one of the supported options/,
  );
});

test("legacy free-text frequencies remain readable and are not silently converted", () => {
  assert.equal(frequency.prescriptionFrequencyLabel("once a day"), "once a day");
  assert.equal(frequency.prescriptionFrequencyLabel("   "), null);
  assert.equal(frequency.prescriptionFrequencyLabel(null), null);
});

test("patient prescription display uses a concise heading and natural instructions", () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(display.formatPrescription({
      medication: "Omeprazole",
      dosage: "20 mg",
      dosageForm: "capsule",
      frequency: "OD",
      duration: "10 days",
      route: "oral",
    }))),
    {
      heading: "Omeprazole 20 mg capsule",
      instruction: "Take one capsule once daily for 10 days.",
    },
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(display.formatPrescription({
      medication: "Paracetamol",
      dosage: "500 mg",
      dosageForm: "tablet",
      frequency: "TID",
      duration: "3 days",
      route: "oral",
    }))),
    {
      heading: "Paracetamol 500 mg tablet",
      instruction: "Take one tablet three times daily for 3 days.",
    },
  );
});

test("patient prescription display handles legacy text and non-tablet routes", () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(display.formatPrescription({
      medication: "Salbutamol",
      dosage: "100 mcg",
      dosageForm: "inhaler",
      frequency: "PRN",
      route: "inhalation",
    }))),
    {
      heading: "Salbutamol 100 mcg inhaler",
      instruction: "Inhale 100 mcg as needed.",
    },
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(display.formatPrescription({
      medication: "Legacy medicine",
      dosage: "1 tab",
      dosageForm: "tablet",
      frequency: "once a day",
      route: "oral",
    }))),
    {
      heading: "Legacy medicine tablet",
      instruction: "Take one tab once a day.",
    },
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(display.formatPrescription({
      medication: "Topical cream",
      dosage: "apply thinly",
      dosageForm: "cream",
      frequency: "BD",
      route: "topical",
    }))),
    {
      heading: "Topical cream",
      instruction: "Apply twice daily. Apply thinly.",
    },
  );
});

test("patient consultation page does not load or render clinician notes or structured clinical entries", async () => {
  const page = await source("app/[locale]/(authenticated)/dashboard/patient/consultations/[id]/page.tsx");
  const client = await source("app/[locale]/(authenticated)/dashboard/patient/consultations/[id]/client.tsx");

  assert.doesNotMatch(page, /consultationNotes/);
  assert.doesNotMatch(page, /getConsultationClinicalSelections/);
  assert.doesNotMatch(page, /consultationDiagnoses/);
  assert.doesNotMatch(page, /prescriptionItems|patientDiagnoses|patientRequests/);
  assert.doesNotMatch(page, /consultations\.symptoms|consultations\.medicalHistory|consultations\.durationOfIllness/);
  assert.match(page, /db\.select\(\{ id: prescriptions\.id \}\)/);

  assert.doesNotMatch(client, /latestNotes|historyNotes|Clinical Summary|\badvice\b/);
  assert.doesNotMatch(client, /Consultation Information|Diagnoses|Laboratory Requests|Radiology Requests/);
  assert.doesNotMatch(client, /nameSnapshot|codeSnapshot|formatPrescription|prescriptionItems/);
  assert.doesNotMatch(client, /symptoms|durationOfIllness|medicalHistory/);
  assert.match(client, /hasPrescriptionDocument/);
  assert.match(client, /hasLaboratoryDocument/);
  assert.match(client, /hasRadiologyDocument/);
});

test("patient consultation list and overview responses do not serialize intake or clinical records", async () => {
  const listPage = await source("app/[locale]/(authenticated)/dashboard/patient/consultations/page.tsx");
  const paymentPage = await source("app/[locale]/(authenticated)/dashboard/patient/consultations/[id]/payment/page.tsx");
  const overview = await source("app/[locale]/(authenticated)/dashboard/patient/data.ts");
  const actions = await source("lib/actions/consultations.ts");

  assert.doesNotMatch(listPage, /\.select\(\)\.from\(consultations\)/);
  assert.doesNotMatch(paymentPage, /\.select\(\)\.from\(consultations\)/);
  assert.doesNotMatch(listPage, /consultations\.symptoms|consultations\.medicalHistory|consultations\.durationOfIllness/);
  assert.doesNotMatch(overview, /\.select\(\)\.from\(consultations\)/);
  assert.doesNotMatch(overview, /consultations\.symptoms|consultations\.medicalHistory|consultations\.durationOfIllness/);

  const summaryStart = actions.indexOf("function patientConsultationSummary");
  const summaryEnd = actions.indexOf("export async function createConsultation");
  assert.ok(summaryStart > -1 && summaryEnd > summaryStart);
  const summary = actions.slice(summaryStart, summaryEnd);
  assert.match(summary, /id: consultation\.id/);
  assert.doesNotMatch(summary, /symptoms|medicalHistory|durationOfIllness|historyNotes|diagnosis|advice/);
  assert.match(actions, /consultation: canViewClinicalNotes \? consultation : patientConsultationSummary\(consultation\)/);
  assert.match(actions, /if \(role === "patient"\)/);
});

test("patient prescription page serializes only patient-facing medication fields", async () => {
  const page = await source("app/[locale]/(authenticated)/dashboard/patient/prescriptions/page.tsx");
  assert.doesNotMatch(page, /\.select\(\)\.from\(prescriptions\)/);
  assert.doesNotMatch(page, /clinicianId|catalogueResourceId|catalogueReleaseId|sourceSnapshot|releaseVersionSnapshot|selectedBy/);
  assert.match(page, /eq\(prescriptions\.patientId, userId\)/);
});

test("patients retain document access while clinicians retain the full clinical workspace", async () => {
  const patientClient = await source("app/[locale]/(authenticated)/dashboard/patient/consultations/[id]/client.tsx");
  const clinicianPage = await source("app/[locale]/(authenticated)/dashboard/clinician/consultations/[id]/page.tsx");

  for (const documentType of ["prescription", "laboratory", "radiology"]) {
    assert.match(patientClient, new RegExp(`type="${documentType}"`));
  }
  assert.match(clinicianPage, /consultationNotes/);
  assert.match(clinicianPage, /getConsultationClinicalSelections/);
  assert.match(clinicianPage, /from\(prescriptions\)/);
});

test("document route authorizes before loading notes and never loads notes for patient documents", async () => {
  const route = await source("app/api/documents/consultation/[id]/[type]/route.ts");
  const allowedIndex = route.indexOf("if (!allowed)");
  const notesIndex = route.indexOf("let notes: DocumentNotes | null");
  assert.ok(allowedIndex > -1);
  assert.ok(notesIndex > allowedIndex);
  assert.match(route, /if \(!isPatientVisibleDocumentType\(documentType\)\) \{[\s\S]*?consultationNotes/);
  assert.match(route, /items: laboratoryRows\.map\(toPatientRequestItem\)/);
  assert.match(route, /items: radiologyRows\.map\(toPatientRequestItem\)/);
});

test("patient-facing PDF renderers do not render clinical summaries", async () => {
  const pdf = await source("lib/catalogue/documents/pdf.ts");
  const prescriptionStart = pdf.indexOf("async function renderPrescription");
  const requestStart = pdf.indexOf("async function renderRequest");
  const reportStart = pdf.indexOf("async function renderReport");
  assert.ok(prescriptionStart > -1 && requestStart > prescriptionStart && reportStart > requestStart);
  assert.doesNotMatch(pdf.slice(prescriptionStart, requestStart), /Clinical summary|clinicalSummary|historyNotes|advice/);
  assert.doesNotMatch(pdf.slice(requestStart, reportStart), /Clinical summary|clinicalSummary|historyNotes|advice|item\.notes|Notes/);
  assert.match(pdf.slice(reportStart), /Clinical summary|clinicalSummary/);
});
