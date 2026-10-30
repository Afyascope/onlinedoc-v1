import {
  catalogueFields,
  SUPPORTED_CODING_SYSTEMS,
  SUPPORTED_ROUTES,
  type CatalogueDomain,
  type CatalogueFieldDefinition,
  type CatalogueRow,
} from "./domains";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  row: number;
  field?: string;
  code: string;
  message: string;
  severity: ValidationSeverity;
}

export interface ValidatedCatalogueRow extends CatalogueRow {
  rowNumber: number;
  raw: Record<string, string>;
}

export interface RejectedCatalogueRow {
  rowNumber: number;
  raw: Record<string, string>;
  reasons: ValidationIssue[];
}

export interface ValidationSummary {
  rowCount: number;
  validRowCount: number;
  invalidRowCount: number;
  errorCount: number;
  warningCount: number;
  validRows: ValidatedCatalogueRow[];
  rejectedRows: RejectedCatalogueRow[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  unknownColumns: string[];
}

const MAX_ROWS = 10_000;

export function normalizeColumnName(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitize(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value).replace(/^\uFEFF/, "");
  // Strip NUL and other control characters except ordinary whitespace.
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  return text.trim();
}

function fieldMap(fields: CatalogueFieldDefinition[]): Map<string, CatalogueFieldDefinition> {
  const map = new Map<string, CatalogueFieldDefinition>();
  for (const field of fields) {
    map.set(normalizeColumnName(field.label), field);
    for (const alias of field.aliases) map.set(normalizeColumnName(alias), field);
  }
  return map;
}

function parseBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "1", "active", "y"].includes(normalized)) return true;
  if (["false", "no", "0", "inactive", "n"].includes(normalized)) return false;
  return null;
}

function parseDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return value;
}

function issue(
  severity: ValidationSeverity,
  row: number,
  code: string,
  message: string,
  field?: string,
): ValidationIssue {
  return { severity, row, code, message, field };
}

function readRow(
  domain: CatalogueDomain,
  raw: Record<string, string>,
  rowNumber: number,
  unknownColumns: Set<string>,
): { row: CatalogueRow; issues: ValidationIssue[] } {
  const fields = catalogueFields(domain);
  const lookup = fieldMap(fields);
  const values = new Map<string, { value: string; label: string }>();

  for (const [header, rawValue] of Object.entries(raw)) {
    const field = lookup.get(normalizeColumnName(header));
    if (!field) {
      if (header.trim()) unknownColumns.add(header.trim());
      continue;
    }
    const value = sanitize(rawValue);
    if (value === "") continue;
    if (values.has(field.field)) {
      // Prefer the first non-empty occurrence; this is deterministic.
      continue;
    }
    values.set(field.field, { value, label: field.label });
  }

  const issues: ValidationIssue[] = [];
  const get = (field: CatalogueFieldDefinition["field"]): string | null => values.get(field)?.value ?? null;

  for (const field of fields) {
    const value = get(field.field);
    if (field.required && !value) {
      issues.push(issue("error", rowNumber, "required", `Missing required field: ${field.label}`, field.label));
    }
    if (value && value.length > field.maxLength) {
      issues.push(issue("error", rowNumber, "too_long", `${field.label} exceeds ${field.maxLength} characters`, field.label));
    }
  }

  const isActiveValue = get("isActive");
  let isActive = true;
  if (isActiveValue) {
    const parsed = parseBoolean(isActiveValue);
    if (parsed === null) {
      issues.push(issue("error", rowNumber, "invalid_boolean", `Invalid active value: ${isActiveValue}`, "Active"));
    } else {
      isActive = parsed;
    }
  }

  const effectiveFrom = get("effectiveFrom");
  const effectiveTo = get("effectiveTo");
  const parsedFrom = effectiveFrom ? parseDate(effectiveFrom) : null;
  const parsedTo = effectiveTo ? parseDate(effectiveTo) : null;
  if (effectiveFrom && !parsedFrom) {
    issues.push(issue("error", rowNumber, "invalid_date", `Invalid effective-from date: ${effectiveFrom}`, "Effective from"));
  }
  if (effectiveTo && !parsedTo) {
    issues.push(issue("error", rowNumber, "invalid_date", `Invalid effective-to date: ${effectiveTo}`, "Effective to"));
  }
  if (parsedFrom && parsedTo && parsedTo < parsedFrom) {
    issues.push(issue("error", rowNumber, "date_order", "Effective-to date cannot be before effective-from date", "Effective to"));
  }

  const codingSystem = get("codingSystem");
  if (codingSystem) {
    const match = SUPPORTED_CODING_SYSTEMS.find(
      (system) => system.toLowerCase() === codingSystem.toLowerCase(),
    );
    if (!match) {
      issues.push(issue("error", rowNumber, "unsupported_coding_system", `Unsupported coding system: ${codingSystem}`, "Coding system"));
    }
  } else if (get("code") && domain === "diagnosis") {
    issues.push(issue("warning", rowNumber, "missing_coding_system", "A diagnosis code was supplied without a coding system", "Coding system"));
  }

  const route = get("route");
  if (route) {
    const match = SUPPORTED_ROUTES.find((value) => value === route.toLowerCase());
    if (!match) {
      issues.push(issue("error", rowNumber, "invalid_route", `Invalid route value: ${route}`, "Route"));
    }
  }

  const sourceUrl = get("sourceUrl");
  if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) {
    issues.push(issue("error", rowNumber, "invalid_url", "Source URL must start with http:// or https://", "Source URL"));
  }

  const row: CatalogueRow = {
    resourceId: get("resourceId") ?? "",
    name: get("name") ?? "",
    code: get("code"),
    codingSystem,
    codingSystemVersion: get("codingSystemVersion"),
    description: get("description"),
    synonyms: get("synonyms"),
    category: get("category"),
    specimen: get("specimen"),
    modality: get("modality"),
    genericName: get("genericName"),
    brandName: get("brandName"),
    activeIngredient: get("activeIngredient"),
    strength: get("strength"),
    dosageForm: get("dosageForm"),
    route,
    source: get("source"),
    sourceIdentifier: get("sourceIdentifier"),
    sourceVersion: get("sourceVersion"),
    sourceUrl,
    provenanceNotes: get("provenanceNotes"),
    effectiveFrom: parsedFrom,
    effectiveTo: parsedTo,
    isActive,
    notes: get("notes"),
  };

  return { row, issues };
}

export function validateCatalogueRows(
  domain: CatalogueDomain,
  rawRows: Record<string, string>[],
): ValidationSummary {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const unknownColumns = new Set<string>();
  const rowNumberBase = 2; // Header is row 1 in the source file.

  if (rawRows.length > MAX_ROWS) {
    errors.push(issue("error", 0, "too_many_rows", `The file contains more than ${MAX_ROWS.toLocaleString()} data rows`));
  }

  const candidates: { row: CatalogueRow; rowNumber: number; raw: Record<string, string>; issues: ValidationIssue[] }[] = [];

  rawRows.forEach((raw, index) => {
    const rowNumber = index + rowNumberBase;
    if (Object.values(raw).every((value) => sanitize(value) === "")) return;
    const { row, issues } = readRow(domain, raw, rowNumber, unknownColumns);
    candidates.push({ row, rowNumber, raw, issues });
  });

  // Duplicate resource identifiers within the uploaded file are fatal.
  const identifiers = new Map<string, number[]>();
  for (const candidate of candidates) {
    const id = candidate.row.resourceId.trim().toLowerCase();
    if (!id) continue;
    identifiers.set(id, [...(identifiers.get(id) ?? []), candidate.rowNumber]);
  }
  identifiers.forEach((rows, identifier) => {
    if (rows.length < 2) return;
    for (const candidate of candidates) {
      if (candidate.row.resourceId.trim().toLowerCase() !== identifier) continue;
      candidate.issues.push(issue(
        "error",
        candidate.rowNumber,
        "duplicate_identifier",
        `Duplicate identifier: ${candidate.row.resourceId} (rows ${rows.join(", ")})`,
        "Resource ID",
      ));
    }
  });

  // Duplicate source identifiers are also fatal when a source is named.
  const sourceKeys = new Map<string, number[]>();
  for (const candidate of candidates) {
    if (!candidate.row.source || !candidate.row.sourceIdentifier) continue;
    const key = `${candidate.row.source.trim().toLowerCase()}\u0000${candidate.row.sourceIdentifier.trim().toLowerCase()}`;
    sourceKeys.set(key, [...(sourceKeys.get(key) ?? []), candidate.rowNumber]);
  }
  sourceKeys.forEach((rows) => {
    if (rows.length < 2) return;
    for (const candidate of candidates) {
      if (!rows.includes(candidate.rowNumber)) continue;
      candidate.issues.push(issue(
        "error",
        candidate.rowNumber,
        "duplicate_source_identifier",
        `Duplicate source identifier: ${candidate.row.sourceIdentifier} (rows ${rows.join(", ")})`,
        "Source identifier",
      ));
    }
  });

  if (unknownColumns.size > 0) {
    warnings.push(issue(
      "warning",
      1,
      "unknown_columns",
      `Unknown column${unknownColumns.size === 1 ? "" : "s"} ignored: ${Array.from(unknownColumns).join(", ")}`,
    ));
  }

  const validRows: ValidatedCatalogueRow[] = [];
  const rejectedRows: RejectedCatalogueRow[] = [];

  for (const candidate of candidates) {
    const rowErrors = candidate.issues.filter((item) => item.severity === "error");
    const rowWarnings = candidate.issues.filter((item) => item.severity === "warning");
    warnings.push(...rowWarnings);
    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      rejectedRows.push({ rowNumber: candidate.rowNumber, raw: candidate.raw, reasons: candidate.issues });
    } else {
      validRows.push({ ...candidate.row, rowNumber: candidate.rowNumber, raw: candidate.raw });
    }
  }

  return {
    rowCount: candidates.length,
    validRowCount: validRows.length,
    invalidRowCount: rejectedRows.length,
    errorCount: errors.length,
    warningCount: warnings.length,
    validRows,
    rejectedRows,
    errors,
    warnings,
    unknownColumns: Array.from(unknownColumns),
  };
}

export function stableComparisonValue(row: CatalogueRow): string {
  return JSON.stringify({
    name: row.name,
    code: row.code,
    codingSystem: row.codingSystem,
    codingSystemVersion: row.codingSystemVersion,
    description: row.description,
    synonyms: row.synonyms,
    category: row.category,
    specimen: row.specimen,
    modality: row.modality,
    genericName: row.genericName,
    brandName: row.brandName,
    activeIngredient: row.activeIngredient,
    strength: row.strength,
    dosageForm: row.dosageForm,
    route: row.route,
    source: row.source,
    sourceIdentifier: row.sourceIdentifier,
    sourceVersion: row.sourceVersion,
    sourceUrl: row.sourceUrl,
    provenanceNotes: row.provenanceNotes,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    isActive: row.isActive,
    notes: row.notes,
  });
}

export interface ImportClassification {
  newRows: ValidatedCatalogueRow[];
  updatedRows: ValidatedCatalogueRow[];
  unchangedRows: ValidatedCatalogueRow[];
}

export function classifyValidatedRows(
  rows: ValidatedCatalogueRow[],
  existing: Map<string, CatalogueRow>,
): ImportClassification {
  const newRows: ValidatedCatalogueRow[] = [];
  const updatedRows: ValidatedCatalogueRow[] = [];
  const unchangedRows: ValidatedCatalogueRow[] = [];

  for (const row of rows) {
    const previous = existing.get(row.resourceId.trim().toLowerCase());
    if (!previous) {
      newRows.push(row);
      continue;
    }
    if (stableComparisonValue(row) === stableComparisonValue(previous)) {
      unchangedRows.push(row);
    } else {
      updatedRows.push(row);
    }
  }

  return { newRows, updatedRows, unchangedRows };
}
