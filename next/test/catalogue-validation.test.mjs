import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { loadTsModule } from "./helpers/load-ts.mjs";

const root = new URL("../", import.meta.url);
const validation = loadTsModule(new URL("lib/catalogue/validation.ts", root));
const csv = loadTsModule(new URL("lib/catalogue/csv.ts", root));
const domains = loadTsModule(new URL("lib/catalogue/domains.ts", root));
const parseUpload = loadTsModule(new URL("lib/catalogue/import/parse-upload.ts", root));
const xlsxMime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function row(overrides = {}) {
  return {
    "Resource ID": "TEST-001",
    Name: "Synthetic resource",
    Source: "Synthetic source",
    ...overrides,
  };
}

test("valid diagnosis row is accepted", () => {
  const summary = validation.validateCatalogueRows("diagnosis", [row({ Code: "A00", "Coding system": "ICD-10", "Coding system version": "2024" })]);
  assert.equal(summary.rowCount, 1);
  assert.equal(summary.validRowCount, 1);
  assert.equal(summary.invalidRowCount, 0);
  assert.equal(summary.validRows[0].codingSystem, "ICD-10");
  assert.equal(summary.validRows[0].rowNumber, 2);
});

test("valid laboratory, radiology and medication imports are accepted", () => {
  const lab = validation.validateCatalogueRows("laboratory", [row({ Specimen: "Blood", Category: "Haematology" })]);
  const rad = validation.validateCatalogueRows("radiology", [row({ Modality: "X-ray" })]);
  const med = validation.validateCatalogueRows("medication", [row({ Strength: "500 mg", Route: "oral", "Dosage form": "tablet" })]);
  assert.equal(lab.validRowCount, 1);
  assert.equal(rad.validRowCount, 1);
  assert.equal(med.validRowCount, 1);
  assert.equal(med.validRows[0].route, "oral");
});

test("medication sample workbook validates all 10 rows with recognized columns", async () => {
  const buffer = readFileSync(new URL("test/fixtures/onlinedoc_sample_medications_simple.xlsx", root));
  const parsed = await parseUpload.parseCatalogueUpload(buffer, "onlinedoc_sample_medications_simple.xlsx", xlsxMime);
  const summary = validation.validateCatalogueRows("medication", parsed.rows);
  const recognized = new Set(domains.catalogueFields("medication").flatMap((field) => [field.label, ...field.aliases]));

  assert.equal(parsed.fileType, "xlsx");
  assert.equal(parsed.sheetName, "Medications");
  assert.equal(parsed.rows.length, 10);
  assert.deepEqual(parsed.warnings, []);
  assert.ok(parsed.headers.every((header) => recognized.has(header)));
  assert.equal(summary.rowCount, 10);
  assert.equal(summary.validRowCount, 10);
  assert.equal(summary.invalidRowCount, 0);
  assert.equal(summary.errorCount, 0);
  assert.deepEqual(summary.unknownColumns, []);
  assert.equal(summary.warnings.filter((item) => item.code === "unknown_columns").length, 0);
  assert.ok(summary.validRows.every((item) => item.resourceId.startsWith("SAMPLE-MED-")));
  assert.ok(summary.validRows.every((item) => item.notes === "Sample row. Do not import into a production catalogue."));
  assert.ok(summary.validRows.every((item) => item.provenanceNotes?.includes("Not for clinical use")));
  assert.ok(summary.validRows.every((item) => domains.SUPPORTED_ROUTES.includes(item.route)));
});

test("Active accepts documented boolean values and Status is only an Active alias", () => {
  for (const value of ["true", "TRUE", "yes", "1", "active", "y"]) {
    const summary = validation.validateCatalogueRows("medication", [row({ "Resource ID": `ACTIVE-${value}`, Active: value })]);
    assert.equal(summary.validRowCount, 1, value);
    assert.equal(summary.validRows[0].isActive, true, value);
  }
  for (const value of ["false", "FALSE", "no", "0", "inactive", "n"]) {
    const summary = validation.validateCatalogueRows("medication", [row({ "Resource ID": `INACTIVE-${value}`, Active: value })]);
    assert.equal(summary.validRowCount, 1, value);
    assert.equal(summary.validRows[0].isActive, false, value);
  }
  const blank = validation.validateCatalogueRows("medication", [row({ "Resource ID": "ACTIVE-BLANK" })]);
  assert.equal(blank.validRows[0].isActive, true);

  const draft = validation.validateCatalogueRows("medication", [row({ "Resource ID": "STATUS-DRAFT", Status: "Draft" })]);
  assert.equal(draft.invalidRowCount, 1);
  assert.ok(draft.errors.some((item) => item.code === "invalid_boolean" && item.message === "Invalid active value: Draft"));

  const statusTrue = validation.validateCatalogueRows("medication", [row({ "Resource ID": "STATUS-TRUE", Status: "true" })]);
  assert.equal(statusTrue.validRowCount, 1);
  assert.equal(statusTrue.validRows[0].isActive, true);
});

test("medication routes accept only standardized route values", () => {
  for (const route of domains.SUPPORTED_ROUTES) {
    const summary = validation.validateCatalogueRows("medication", [row({ "Resource ID": `ROUTE-${route}`, Route: route })]);
    assert.equal(summary.validRowCount, 1, route);
    assert.equal(summary.validRows[0].route, route);
  }
  const upper = validation.validateCatalogueRows("medication", [row({ "Resource ID": "ROUTE-UPPER", Route: "ORAL" })]);
  assert.equal(upper.validRowCount, 1);
  assert.equal(upper.validRows[0].route, "ORAL");

  const ambiguous = validation.validateCatalogueRows("medication", [row({ "Resource ID": "ROUTE-AMBIGUOUS", Route: "Subcutaneous / intravenous as prescribed" })]);
  assert.equal(ambiguous.invalidRowCount, 1);
  assert.ok(ambiguous.errors.some((item) => item.code === "invalid_route" && item.message.includes("Invalid route value")));
});

test("medication safety_notes column is ignored with a warning", () => {
  const summary = validation.validateCatalogueRows("medication", [row({ "Resource ID": "UNKNOWN-SAFETY", safety_notes: "Not a recognized column" })]);
  assert.equal(summary.validRowCount, 1);
  assert.deepEqual(summary.unknownColumns, ["safety_notes"]);
  assert.ok(summary.warnings.some((item) => item.code === "unknown_columns" && item.message.includes("safety_notes")));
});

test("missing required fields identify the row and field", () => {
  const summary = validation.validateCatalogueRows("diagnosis", [row({ "Resource ID": "", Name: "" })]);
  assert.equal(summary.invalidRowCount, 1);
  assert.ok(summary.errors.some((item) => item.message === "Missing required field: Resource ID" && item.row === 2));
  assert.ok(summary.errors.some((item) => item.message === "Missing required field: Name" && item.row === 2));
});

test("duplicate resource identifiers are fatal for every duplicate row", () => {
  const summary = validation.validateCatalogueRows("laboratory", [row({ "Resource ID": "DUP-1" }), row({ "Resource ID": "dup-1" })]);
  assert.equal(summary.invalidRowCount, 2);
  assert.equal(summary.errors.filter((item) => item.code === "duplicate_identifier").length, 2);
});

test("duplicate source identifiers are fatal", () => {
  const summary = validation.validateCatalogueRows("radiology", [row({ "Resource ID": "A", "Source identifier": "S-1" }), row({ "Resource ID": "B", "Source identifier": "S-1" })]);
  assert.equal(summary.invalidRowCount, 2);
  assert.ok(summary.errors.some((item) => item.code === "duplicate_source_identifier"));
});

test("unsupported coding systems and routes are rejected", () => {
  const coding = validation.validateCatalogueRows("diagnosis", [row({ Code: "X", "Coding system": "Made up terminology" })]);
  assert.equal(coding.invalidRowCount, 1);
  assert.ok(coding.errors.some((item) => item.message.includes("Unsupported coding system")));
  const route = validation.validateCatalogueRows("medication", [row({ Route: "teleport" })]);
  assert.equal(route.invalidRowCount, 1);
  assert.ok(route.errors.some((item) => item.message.includes("Invalid route value")));
});

test("invalid dates, booleans and URLs are rejected", () => {
  const summary = validation.validateCatalogueRows("medication", [row({ "Effective from": "2024-02-31", Active: "maybe", "Source URL": "javascript:alert(1)" })]);
  assert.equal(summary.invalidRowCount, 1);
  assert.equal(summary.errors.filter((item) => item.severity === "error").length, 3);
});

test("unknown columns are reported as warnings, not fatal errors", () => {
  const summary = validation.validateCatalogueRows("diagnosis", [row({ "Unexpected column": "value" })]);
  assert.equal(summary.validRowCount, 1);
  assert.ok(summary.warnings.some((item) => item.code === "unknown_columns"));
});

test("rows are classified against the active catalogue", () => {
  const summary = validation.validateCatalogueRows("diagnosis", [
    row({ "Resource ID": "NEW" }),
    row({ "Resource ID": "SAME", Name: "Unchanged" }),
    row({ "Resource ID": "CHANGED", Name: "Changed" }),
  ]);
  const existing = new Map([
    ["same", { resourceId: "SAME", name: "Unchanged", code: null, codingSystem: null, codingSystemVersion: null, description: null, synonyms: null, category: null, specimen: null, modality: null, genericName: null, brandName: null, activeIngredient: null, strength: null, dosageForm: null, route: null, source: "Synthetic source", sourceIdentifier: null, sourceVersion: null, sourceUrl: null, provenanceNotes: null, effectiveFrom: null, effectiveTo: null, isActive: true, notes: null }],
    ["changed", { resourceId: "CHANGED", name: "Old name", code: null, codingSystem: null, codingSystemVersion: null, description: null, synonyms: null, category: null, specimen: null, modality: null, genericName: null, brandName: null, activeIngredient: null, strength: null, dosageForm: null, route: null, source: "Synthetic source", sourceIdentifier: null, sourceVersion: null, sourceUrl: null, provenanceNotes: null, effectiveFrom: null, effectiveTo: null, isActive: true, notes: null }],
  ]);
  const classified = validation.classifyValidatedRows(summary.validRows, existing);
  assert.equal(classified.newRows.length, 1);
  assert.equal(classified.updatedRows.length, 1);
  assert.equal(classified.unchangedRows.length, 1);
});

test("CSV parser handles quoted values, escaped quotes and BOM", () => {
  const parsed = csv.parseCsv('\uFEFFResource ID,Name,Description\r\n"ID-1","Name, with comma","Line 1\nLine 2"\r\n"ID-2","Quote ""inside""",\r\n');
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0].Name, "Name, with comma");
  assert.equal(parsed.rows[0].Description, "Line 1\nLine 2");
  assert.equal(parsed.rows[1].Name, 'Quote "inside"');
});

test("CSV parser detects semicolon and tab delimiters", () => {
  assert.equal(csv.detectDelimiter("a;b;c"), ";");
  assert.equal(csv.detectDelimiter("a\tb\tc"), "\t");
  assert.equal(csv.detectDelimiter("a,b,c"), ",");
});

test("templates expose required and optional columns without clinical data", () => {
  const diagnosis = domains.templateCsv("diagnosis");
  assert.ok(diagnosis.includes('"Resource ID"'));
  assert.ok(diagnosis.includes('"Name"'));
  assert.ok(!diagnosis.includes("Synthetic resource"));
  const medication = domains.templateColumns("medication");
  assert.ok(medication.some((column) => column.label === "Route" && !column.required));
});

test("CSV parser warns about duplicate column names", () => {
  const parsed = csv.parseCsv('Resource ID,Name,Name\nID-1,First,Second\n');
  assert.equal(parsed.rows.length, 1);
  assert.ok(parsed.warnings.some((warning) => warning.includes("Duplicate column names")));
});
