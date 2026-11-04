import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import postgres from "postgres";
import { applyMigrations, applyTestDatabaseEnvironment, resetTestSchema } from "./support.mjs";

const require = createRequire(import.meta.url);
const ExcelJS = require("exceljs");

const databaseUrl = applyTestDatabaseEnvironment("CATALOGUE_TEST_DATABASE_URL");
process.env.NODE_ENV = "test";

const adminId = "test-admin";
const clinicianId = "test-clinician";
const patientId = "test-patient";

let sql;
let service;
let db;
let firstDiagnosisRelease;
let firstDiagnosisResourceId;
let firstDiagnosisBody;

function csv(rows) {
  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    const text = value == null ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

function fileFrom(text, name, type = "text/csv") {
  return new File([Buffer.from(text, "utf8")], name, { type });
}

async function previewAndActivate(input) {
  const preview = await service.previewCatalogueImport(input);
  assert.equal(preview.canConfirm, true, JSON.stringify(preview.errors));
  await service.confirmCatalogueImport({ releaseId: preview.releaseId, actorId: adminId });
  await service.approveCatalogueRelease({ releaseId: preview.releaseId, actorId: adminId });
  await service.activateCatalogueRelease({ releaseId: preview.releaseId, actorId: adminId });
  return preview;
}

before(async () => {
  sql = postgres(databaseUrl, { ssl: "require", max: 1, connect_timeout: 10 });
  await resetTestSchema(sql);
  await applyMigrations(sql);

  await sql`
    INSERT INTO "user" (id, name, email, email_verified, role, clinician_status, created_at, updated_at) VALUES
      (${adminId}, 'Test Admin', 'admin@catalogue.test', true, 'admin', 'APPROVED', now(), now()),
      (${clinicianId}, 'Test Clinician', 'clinician@catalogue.test', true, 'clinician', 'APPROVED', now(), now()),
      (${patientId}, 'Test Patient', 'patient@catalogue.test', true, 'patient', 'PENDING', now(), now())
  `;

  service = await import("../lib/catalogue/service.ts");
  ({ db } = await import("../db/index.ts"));
});

after(async () => {
  if (db?.$client) await db.$client.end({ timeout: 1 }).catch(() => undefined);
  if (sql) await sql.end({ timeout: 1 }).catch(() => undefined);
});

test("migrations create the catalogue schema and provenance columns", async () => {
  const tables = await sql`select table_name from information_schema.tables where table_schema = 'public'`;
  const names = tables.map((row) => row.table_name);
  for (const table of ["catalogue_releases", "catalogue_resources", "catalogue_resource_history", "consultation_diagnoses", "consultation_requests", "consultation_documents"]) {
    assert.ok(names.includes(table), `missing ${table}`);
  }
  const columns = await sql`select column_name from information_schema.columns where table_name = 'catalogue_resources'`;
  const columnNames = columns.map((row) => row.column_name);
  for (const column of ["stable_identifier", "coding_system", "provenance_notes", "notes", "metadata", "lifecycle"]) {
    assert.ok(columnNames.includes(column), `missing catalogue_resources.${column}`);
  }
  const notes = await sql`select column_name from information_schema.columns where table_name = 'consultation_notes'`;
  assert.ok(notes.some((row) => row.column_name === "history_notes"));

  const activeIndex = await sql`
    select indexdef from pg_indexes
    where schemaname = 'public' and indexname = 'catalogue_releases_one_active_per_domain'
  `;
  assert.equal(activeIndex.length, 1);
  assert.match(activeIndex[0].indexdef, /UNIQUE INDEX/);
  assert.match(activeIndex[0].indexdef, /WHERE/);
});

test("CSV diagnosis import validates, confirms, approves and activates", async () => {
  const body = csv([
    { "Resource ID": "DX-COUGH", Name: "Cough", Code: "R05", "Coding system": "ICD-10", "Coding system version": "2024", Source: "Synthetic ICD", "Source identifier": "R05" },
    { "Resource ID": "DX-FEVER", Name: "Fever", Code: "R50.9", "Coding system": "ICD-10", "Coding system version": "2024", Source: "Synthetic ICD", "Source identifier": "R50.9" },
  ]);
  firstDiagnosisBody = body;
  const preview = await previewAndActivate({
    file: fileFrom(body, "diagnoses.csv"),
    domain: "diagnosis",
    actorId: adminId,
  });
  assert.equal(preview.validRowCount, 2);
  assert.equal(preview.newCount, 2);
  firstDiagnosisRelease = preview.releaseId;

  const release = await service.getActiveRelease("diagnosis");
  assert.equal(release.id, preview.releaseId);
  assert.equal(release.status, "active");

  const results = await service.searchActiveCatalogue("diagnosis", "cough");
  assert.equal(results.length, 1);
  assert.equal(results[0].name, "Cough");
  assert.equal(results[0].code, "R05");
  assert.equal(results[0].codingSystem, "ICD-10");
  firstDiagnosisResourceId = results[0].id;

  const loaded = await service.loadSelectableResources("diagnosis", [results[0].id, "missing"]);
  assert.equal(loaded.size, 1);
  assert.equal(loaded.get(results[0].id).name, "Cough");
});

test("XLSX laboratory import is parsed with cached formula values", async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("laboratory");
  sheet.addRow(["Resource ID", "Name", "Category", "Specimen", "Source"]);
  sheet.addRow(["LAB-FBC", "Full blood count", "Haematology", "Blood", "Synthetic lab"]);
  const formulaRow = sheet.addRow(["LAB-CRP", "C-reactive protein", "Chemistry", "Blood", "Synthetic lab"]);
  formulaRow.getCell(2).value = { formula: '"C-reactive "&"protein"', result: "C-reactive protein" };
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

  const preview = await previewAndActivate({
    file: new File([buffer], "laboratory.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    domain: "laboratory",
    actorId: adminId,
  });
  assert.equal(preview.validRowCount, 2);
  assert.equal(preview.fileType, "xlsx");

  const results = await service.searchActiveCatalogue("laboratory", "C-reactive");
  assert.equal(results.length, 1);
  assert.equal(results[0].name, "C-reactive protein");
  assert.equal((await service.getActiveRelease("laboratory")).id, preview.releaseId);
});

test("invalid rows cannot be confirmed and the release remains draft", async () => {
  const preview = await service.previewCatalogueImport({
    file: fileFrom(csv([{ "Resource ID": "DX-BAD", Name: "", Source: "Synthetic" }]), "bad.csv"),
    domain: "diagnosis",
    actorId: adminId,
  });
  assert.equal(preview.canConfirm, false);
  assert.equal(preview.invalidRowCount, 1);
  await assert.rejects(
    service.confirmCatalogueImport({ releaseId: preview.releaseId, actorId: adminId }),
    /validation errors/,
  );
  assert.equal((await service.loadRelease(preview.releaseId)).status, "draft");
});

test("duplicate files are warned about and cannot be confirmed twice", async () => {
  const preview = await service.previewCatalogueImport({
    file: fileFrom(firstDiagnosisBody, "diagnoses.csv"),
    domain: "diagnosis",
    actorId: adminId,
  });
  assert.equal(preview.canConfirm, false);
  assert.ok(preview.fileWarnings.some((warning) => warning.includes("already been imported")));
  await assert.rejects(
    service.confirmCatalogueImport({ releaseId: preview.releaseId, actorId: adminId }),
    /already been imported/,
  );
});

test("a new release supersedes the previous active release without deleting history", async () => {
  const body = csv([
    { "Resource ID": "DX-COUGH", Name: "Productive cough", Code: "R05", "Coding system": "ICD-10", "Coding system version": "2025", Source: "Synthetic ICD", "Source identifier": "R05" },
    { "Resource ID": "DX-FEVER", Name: "Fever", Code: "R50.9", "Coding system": "ICD-10", "Coding system version": "2025", Source: "Synthetic ICD", "Source identifier": "R50.9" },
    { "Resource ID": "DX-HEADACHE", Name: "Headache", Code: "R51", "Coding system": "ICD-10", "Coding system version": "2025", Source: "Synthetic ICD" },
  ]);
  const preview = await service.previewCatalogueImport({
    file: fileFrom(body, "diagnoses-v2.csv"),
    domain: "diagnosis",
    actorId: adminId,
  });
  assert.equal(preview.updatedCount, 2);
  assert.equal(preview.newCount, 1);
  assert.equal(preview.unchangedCount, 0);
  await service.confirmCatalogueImport({ releaseId: preview.releaseId, actorId: adminId });
  await service.approveCatalogueRelease({ releaseId: preview.releaseId, actorId: adminId });
  await service.activateCatalogueRelease({ releaseId: preview.releaseId, actorId: adminId });

  const oldRelease = await service.loadRelease(firstDiagnosisRelease);
  assert.equal(oldRelease.status, "retired");
  const oldResources = await sql`select lifecycle from catalogue_resources where release_id = ${firstDiagnosisRelease}`;
  assert.ok(oldResources.length >= 2);
  assert.ok(oldResources.every((row) => row.lifecycle === "retired"));

  const oldResource = await sql`select id, name from catalogue_resources where id = ${firstDiagnosisResourceId}`;
  assert.equal(oldResource[0].name, "Cough");

  const results = await service.searchActiveCatalogue("diagnosis", "productive");
  assert.equal(results.length, 1);
  assert.equal(results[0].name, "Productive cough");
  assert.equal(results[0].releaseId, preview.releaseId);

  const active = await sql`select id from catalogue_releases where domain = 'diagnosis' and status = 'active'`;
  assert.equal(active.length, 1);
  await assert.rejects(
    sql`insert into catalogue_releases (id, domain, file_name, file_checksum, status, imported_by) values ('conflicting-active', 'diagnosis', 'x.csv', 'x', 'active', ${adminId})`,
    /catalogue_releases_one_active_per_domain/,
  );
});

test("resource activation changes are audited and immediately affect search", async () => {
  const current = await service.searchActiveCatalogue("diagnosis", "headache");
  assert.equal(current.length, 1);
  const resourceId = current[0].id;

  await service.setCatalogueResourceActive({ resourceId, active: false, actorId: adminId, reason: "Synthetic deactivation" });
  assert.equal((await service.searchActiveCatalogue("diagnosis", "headache")).length, 0);

  const history = await service.getCatalogueResourceHistory(resourceId);
  assert.equal(history[0].action, "deactivated");
  assert.equal(history[0].reason, "Synthetic deactivation");

  await service.setCatalogueResourceActive({ resourceId, active: true, actorId: adminId, reason: "Synthetic reactivation" });
  assert.equal((await service.searchActiveCatalogue("diagnosis", "headache")).length, 1);
  assert.equal((await service.getCatalogueResourceHistory(resourceId))[0].action, "reactivated");
});

test("snapshots, request constraints and delete protection hold at the database layer", async () => {
  const [active] = await sql`select id, release_id from catalogue_resources where stable_identifier = 'DX-COUGH' and lifecycle = 'active' limit 1`;
  assert.ok(active);

  await sql`insert into consultations (id, patient_id, clinician_id, title, status, completed_at) values ('consult-1', ${patientId}, ${clinicianId}, 'Synthetic consultation', 'completed', now())`;

  await sql`
    insert into consultation_diagnoses (id, consultation_id, resource_id, release_id, code_snapshot, name_snapshot, coding_system_snapshot, source_snapshot, release_version_snapshot, selected_by)
    values ('diag-snapshot-1', 'consult-1', ${active.id}, ${active.release_id}, 'R05', 'Productive cough', 'ICD-10', 'Synthetic ICD', '2025', ${clinicianId})
  `;

  await sql`update catalogue_resources set name = 'Renamed after selection' where id = ${active.id}`;
  const [snapshot] = await sql`select name_snapshot from consultation_diagnoses where id = 'diag-snapshot-1'`;
  assert.equal(snapshot.name_snapshot, "Productive cough");

  await assert.rejects(
    sql`insert into consultation_requests (id, consultation_id, domain, resource_id, release_id, name_snapshot, requested_by) values ('req-bad', 'consult-1', 'diagnosis', ${active.id}, ${active.release_id}, 'X', ${clinicianId})`,
    /consultation_requests_domain_check/,
  );

  await assert.rejects(
    sql`insert into consultation_documents (id, consultation_id, document_type, generated_by) values ('doc-bad', 'consult-1', 'unapproved', ${clinicianId})`,
    /consultation_documents_type_check/,
  );

  await assert.rejects(
    sql`delete from catalogue_resources where id = ${active.id}`,
    /violates foreign key constraint/,
  );
});

test("overview and admin listings expose releases without leaking staged rows", async () => {
  const overview = await service.getCatalogueOverview();
  const diagnosis = overview.find((item) => item.domain === "diagnosis");
  assert.equal(diagnosis.currentRelease.id, (await service.getActiveRelease("diagnosis")).id);
  assert.ok(diagnosis.activeCount >= 1);

  const releases = await service.listCatalogueReleases("diagnosis");
  assert.ok(releases.length >= 3);
  assert.ok(releases.every((release) => release.rows === undefined));
  assert.ok(releases.every((release) => release.validationResult === undefined));
  assert.equal(releases[0].importedByName, "Test Admin");

  const invalidRelease = releases.find((release) => release.invalidRowCount === 1);
  assert.ok(invalidRelease);
  const staged = await service.loadRelease(invalidRelease.id);
  assert.ok(Array.isArray(staged.rows));
});

test("medication search starts at one character and matches name, prefix, code, synonym, generic and brand", async () => {
  const body = csv([
    { "Resource ID": "MED-PARA", Name: "Panadol 500 mg", Code: "MED-001", "Generic name": "Paracetamol", "Brand name": "Panadol", Synonyms: "Acetaminophen", Category: "Analgesic", Source: "Synthetic formulary" },
    { "Resource ID": "MED-IBU", Name: "Ibuprofen 200 mg", Code: "MED-002", "Generic name": "Ibuprofen", "Brand name": "Brufen", Synonyms: "Ibuprofen", Category: "NSAID", Source: "Synthetic formulary" },
    { "Resource ID": "MED-ASP", Name: "Aspirin 75 mg", Code: "MED-003", "Generic name": "Aspirin", "Brand name": "Disprin", Synonyms: "Acetylsalicylic acid", Category: "Antiplatelet", Source: "Synthetic formulary" },
  ]);
  const preview = await previewAndActivate({
    file: fileFrom(body, "medications.csv"),
    domain: "medication",
    actorId: adminId,
  });
  assert.equal(preview.validRowCount, 3);

  const firstCharacter = await service.searchActiveCatalogue("medication", "p");
  assert.ok(firstCharacter.some((row) => row.stableIdentifier === "MED-PARA"));
  assert.equal(firstCharacter[0].stableIdentifier, "MED-PARA");

  const uppercaseFirstCharacter = await service.searchActiveCatalogue("medication", "P");
  assert.equal(uppercaseFirstCharacter[0].stableIdentifier, "MED-PARA");

  const byNameExact = await service.searchActiveCatalogue("medication", "Ibuprofen 200 mg");
  assert.equal(byNameExact[0].stableIdentifier, "MED-IBU");

  const byNamePrefix = await service.searchActiveCatalogue("medication", "ibu");
  assert.equal(byNamePrefix[0].stableIdentifier, "MED-IBU");

  const byCode = await service.searchActiveCatalogue("medication", "MED-002");
  assert.equal(byCode[0].stableIdentifier, "MED-IBU");

  const byGeneric = await service.searchActiveCatalogue("medication", "paracetamol");
  assert.equal(byGeneric[0].stableIdentifier, "MED-PARA");

  const byBrand = await service.searchActiveCatalogue("medication", "disprin");
  assert.equal(byBrand[0].stableIdentifier, "MED-ASP");

  const bySynonym = await service.searchActiveCatalogue("medication", "acetaminophen");
  assert.equal(bySynonym[0].stableIdentifier, "MED-PARA");

  const bySubstring = await service.searchActiveCatalogue("medication", "profen");
  assert.equal(bySubstring[0].stableIdentifier, "MED-IBU");
});

test("validated but inactive releases and inactive resources are not searchable", async () => {
  const hiddenBody = csv([
    { "Resource ID": "MED-HIDDEN", Name: "Hidden medication", Code: "MED-999", "Generic name": "Hidden", Source: "Synthetic formulary" },
  ]);
  const draft = await service.previewCatalogueImport({
    file: fileFrom(hiddenBody, "hidden-medications.csv"),
    domain: "medication",
    actorId: adminId,
  });
  assert.equal(draft.canConfirm, true);
  await service.confirmCatalogueImport({ releaseId: draft.releaseId, actorId: adminId });
  assert.equal((await service.searchActiveCatalogue("medication", "hidden")).length, 0);

  const current = await service.searchActiveCatalogue("medication", "aspirin");
  assert.equal(current.length, 1);
  await service.setCatalogueResourceActive({ resourceId: current[0].id, active: false, actorId: adminId });
  assert.equal((await service.searchActiveCatalogue("medication", "aspirin")).length, 0);
});
