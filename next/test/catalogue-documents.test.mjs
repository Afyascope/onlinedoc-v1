import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTsModule } from "./helpers/load-ts.mjs";

const root = new URL("../", import.meta.url);
const documents = loadTsModule(new URL("lib/catalogue/documents/data.ts", root));

const person = { name: "Synthetic Patient", email: "patient@example.test" };
const clinician = { name: "Synthetic Clinician", specialization: "General practice" };
const consultation = {
  id: "consult-12345678",
  title: "Synthetic consultation",
  consultationType: "general",
  status: "completed",
  createdAt: "2026-01-01T00:00:00.000Z",
  completedAt: "2026-01-01T01:00:00.000Z",
};

test("prescription document contains patient-specific prescription data without clinical notes", () => {
  const document = documents.buildPrescriptionDocument({
    patient: person,
    clinician,
    consultation,
    items: [{ medication: "Synthetic medicine", dosage: "1 tablet", frequency: "daily", route: "oral" }],
  });
  assert.equal(document.kind, "prescription");
  assert.equal(document.items.length, 1);
  assert.equal("clinicalSummary" in document, false);
});

test("laboratory and radiology request documents label their domains", () => {
  const lab = documents.buildRequestDocument({ kind: "laboratory", patient: person, clinician, consultation, items: [] });
  const rad = documents.buildRequestDocument({ kind: "radiology", patient: person, clinician, consultation, items: [] });
  assert.equal(lab.title, "Laboratory Request Form");
  assert.equal(rad.title, "Radiology Request Form");
  assert.equal("clinicalSummary" in lab, false);
  assert.equal("clinicalSummary" in rad, false);
});

test("clinical report includes all structured sections and history summary", () => {
  const document = documents.buildClinicalReportDocument({
    patient: person,
    clinician,
    consultation,
    notes: { historyNotes: "History only source", advice: "Advice text", followUpDate: "2026-02-01" },
    diagnoses: [{ nameSnapshot: "Synthetic diagnosis" }],
    laboratory: [{ nameSnapshot: "Synthetic lab" }],
    radiology: [{ nameSnapshot: "Synthetic imaging" }],
    prescriptions: [{ medication: "Synthetic medicine", dosage: "1", frequency: "daily" }],
  });
  assert.equal(document.clinicalSummary, "History only source");
  assert.equal(document.diagnoses.length, 1);
  assert.equal(document.laboratory.length, 1);
  assert.equal(document.radiology.length, 1);
  assert.equal(document.prescriptions.length, 1);
});

test("facesheet is a clinician-facing summary and does not claim to be a report", () => {
  const document = documents.buildFacesheetDocument({
    patient: person,
    clinician,
    consultation,
    notes: { historyNotes: "History" },
    diagnoses: [],
    laboratory: [],
    radiology: [],
    prescriptions: [],
  });
  assert.equal(document.kind, "facesheet");
  assert.equal(document.title, "Medical Facesheet");
});

const pdf = loadTsModule(new URL("lib/catalogue/documents/pdf.ts", root));

test("PDF renderer produces a valid PDF with long and non-ASCII content", async () => {
  const document = documents.buildPrescriptionDocument({
    patient: { name: "Synthetic Patient 李雷 Λ", email: "patient@example.test" },
    clinician,
    consultation,
    items: Array.from({ length: 20 }, (_, index) => ({
      medication: `Synthetic medicine ${index + 1}`,
      dosage: "1 tablet",
      frequency: "daily",
      duration: "5 days",
      route: "oral",
      instructions: "Take with food. ".repeat(8),
    })),
  });
  const bytes = await pdf.renderClinicalDocument(document);
  assert.ok(bytes instanceof Uint8Array);
  assert.ok(bytes.byteLength > 1000);
  assert.equal(Buffer.from(bytes.subarray(0, 4)).toString("utf8"), "%PDF");
});
