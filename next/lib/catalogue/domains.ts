/**
 * Clinical catalogue domain definitions.
 *
 * These definitions describe the administrative import contract only. They do
 * not contain clinical terminology: all names, codes and descriptions come from
 * an approved source file supplied by an administrator.
 */

export const CATALOGUE_DOMAINS = ["diagnosis", "laboratory", "radiology", "medication"] as const;

export type CatalogueDomain = (typeof CATALOGUE_DOMAINS)[number];

export const CATALOGUE_DOMAIN_LABELS: Record<CatalogueDomain, string> = {
  diagnosis: "Diagnoses",
  laboratory: "Laboratory tests",
  radiology: "Radiology services",
  medication: "Medications",
};

export const CATALOGUE_DOMAIN_SINGULAR: Record<CatalogueDomain, string> = {
  diagnosis: "Diagnosis",
  laboratory: "Laboratory test",
  radiology: "Radiology service",
  medication: "Medication",
};

export const RELEASE_STATUSES = ["draft", "validated", "approved", "active", "retired", "failed"] as const;
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];

export const RESOURCE_LIFECYCLES = ["imported", "validated", "active", "inactive", "retired"] as const;
export type ResourceLifecycle = (typeof RESOURCE_LIFECYCLES)[number];

export const REQUEST_DOMAINS = ["laboratory", "radiology"] as const;
export type RequestDomain = (typeof REQUEST_DOMAINS)[number];

export const DOCUMENT_TYPES = ["prescription", "laboratory", "radiology", "report", "facesheet"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** Coding systems accepted by the import validator. Values are administrative
 * identifiers, not clinical content. Additional systems require a code change
 * and governance review rather than silently accepting unknown values. */
export const SUPPORTED_CODING_SYSTEMS = [
  "ICD-10",
  "ICD-11",
  "SNOMED CT",
  "LOINC",
  "CPT",
  "HCPCS",
  "RxNorm",
  "ATC",
  "local",
] as const;

/** Operational route values used for import validation. Unknown routes are
 * rejected so a malformed spreadsheet cannot pollute the catalogue. Allowed
 * values can be extended through code review; no route terminology is invented
 * beyond this operational list. */
export const SUPPORTED_ROUTES = [
  "oral",
  "intravenous",
  "intramuscular",
  "subcutaneous",
  "sublingual",
  "topical",
  "transdermal",
  "inhalation",
  "nasal",
  "ophthalmic",
  "otic",
  "rectal",
  "vaginal",
  "enteral",
  "other",
] as const;

export interface CatalogueFieldDefinition {
  field: keyof CatalogueRow;
  label: string;
  required?: boolean;
  aliases: string[];
  maxLength: number;
}

export interface CatalogueRow {
  resourceId: string;
  name: string;
  code: string | null;
  codingSystem: string | null;
  codingSystemVersion: string | null;
  description: string | null;
  synonyms: string | null;
  category: string | null;
  specimen: string | null;
  modality: string | null;
  genericName: string | null;
  brandName: string | null;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  route: string | null;
  source: string | null;
  sourceIdentifier: string | null;
  sourceVersion: string | null;
  sourceUrl: string | null;
  provenanceNotes: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isActive: boolean;
  notes: string | null;
}

const commonFields: CatalogueFieldDefinition[] = [
  { field: "resourceId", label: "Resource ID", required: true, aliases: ["resource id", "resource_id", "identifier", "stable identifier", "stable_identifier", "id"], maxLength: 200 },
  { field: "name", label: "Name", required: true, aliases: ["name", "display name", "display_name", "term", "service name", "service_name", "test name", "test_name", "medication name", "medication_name"], maxLength: 500 },
  { field: "code", label: "Code", aliases: ["code", "local code", "local_code"], maxLength: 100 },
  { field: "codingSystem", label: "Coding system", aliases: ["coding system", "coding_system", "code system", "code_system"], maxLength: 100 },
  { field: "codingSystemVersion", label: "Coding system version", aliases: ["coding system version", "coding_system_version", "code system version", "code_system_version"], maxLength: 100 },
  { field: "description", label: "Description", aliases: ["description", "details"], maxLength: 4000 },
  { field: "synonyms", label: "Synonyms", aliases: ["synonyms", "synonym", "alternate names", "alternate_names", "terms"], maxLength: 2000 },
  { field: "category", label: "Category", aliases: ["category", "group"], maxLength: 200 },
  { field: "source", label: "Source", aliases: ["source", "source name", "source_name"], maxLength: 300 },
  { field: "sourceIdentifier", label: "Source identifier", aliases: ["source identifier", "source_identifier", "source id", "source_id"], maxLength: 300 },
  { field: "sourceVersion", label: "Source version", aliases: ["source version", "source_version", "release", "version"], maxLength: 100 },
  { field: "sourceUrl", label: "Source URL", aliases: ["source url", "source_url"], maxLength: 1000 },
  { field: "provenanceNotes", label: "Provenance notes", aliases: ["provenance notes", "provenance_notes", "licence", "license", "licence notes", "license_notes"], maxLength: 2000 },
  { field: "effectiveFrom", label: "Effective from", aliases: ["effective from", "effective_from", "valid from", "valid_from"], maxLength: 40 },
  { field: "effectiveTo", label: "Effective to", aliases: ["effective to", "effective_to", "valid to", "valid_to"], maxLength: 40 },
  { field: "isActive", label: "Active", aliases: ["active", "is active", "is_active", "status"], maxLength: 20 },
  { field: "notes", label: "Notes", aliases: ["notes", "comment", "comments"], maxLength: 2000 },
];

const domainOnlyFields: Record<CatalogueDomain, CatalogueFieldDefinition[]> = {
  diagnosis: [],
  laboratory: [
    { field: "specimen", label: "Specimen", aliases: ["specimen", "sample", "sample type", "sample_type"], maxLength: 200 },
  ],
  radiology: [
    { field: "modality", label: "Modality", aliases: ["modality", "imaging modality", "imaging_modality"], maxLength: 200 },
  ],
  medication: [
    { field: "genericName", label: "Generic name", aliases: ["generic name", "generic_name"], maxLength: 300 },
    { field: "brandName", label: "Brand name", aliases: ["brand name", "brand_name"], maxLength: 300 },
    { field: "activeIngredient", label: "Active ingredient", aliases: ["active ingredient", "active_ingredient", "ingredient"], maxLength: 500 },
    { field: "strength", label: "Strength", aliases: ["strength", "dose strength", "dose_strength"], maxLength: 100 },
    { field: "dosageForm", label: "Dosage form", aliases: ["dosage form", "dosage_form", "form"], maxLength: 100 },
    { field: "route", label: "Route", aliases: ["route", "administration route", "administration_route"], maxLength: 100 },
  ],
};

export function catalogueFields(domain: CatalogueDomain): CatalogueFieldDefinition[] {
  return [...commonFields, ...domainOnlyFields[domain]];
}

export function isCatalogueDomain(value: string): value is CatalogueDomain {
  return (CATALOGUE_DOMAINS as readonly string[]).includes(value);
}

export function isRequestDomain(value: string): value is RequestDomain {
  return (REQUEST_DOMAINS as readonly string[]).includes(value);
}

export function isDocumentType(value: string): value is DocumentType {
  return (DOCUMENT_TYPES as readonly string[]).includes(value);
}

/** Column layout shown in the downloadable CSV template and admin help text. */
export function templateColumns(domain: CatalogueDomain): { label: string; required: boolean }[] {
  return catalogueFields(domain).map((field) => ({ label: field.label, required: Boolean(field.required) }));
}

export function templateCsv(domain: CatalogueDomain): string {
  const fields = catalogueFields(domain);
  return `${fields.map((field) => csvEscape(field.label)).join(",")}\r\n`;
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}
