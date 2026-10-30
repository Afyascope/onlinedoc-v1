# Clinical Catalogue

## Purpose

The clinical catalogue is the authoritative source of diagnoses, laboratory
tests, radiology services, and medications that clinicians select while
completing consultations.

It is implemented in the Next.js application with PostgreSQL as the runtime
source of truth. Strapi is not used for clinical catalogues, and Excel/CSV
files are never read at request time.

---

## Design Principles

- PostgreSQL is the only runtime catalogue store.
- Imported files are staged and validated before any clinician can see them.
- Every import is versioned as a release.
- Catalogues are released atomically per domain.
- Consultation records keep immutable snapshots of the catalogue values that
  were selected.
- Clinical terminology is supplied by approved source files. The application
  does not hardcode diagnoses, tests, imaging services, or medicines.
- Patient-facing documents are limited to documents generated from the
  patient's own consultation data.

---

## Domains

| Domain | Purpose | Example fields |
| --- | --- | --- |
| `diagnosis` | Diagnoses and coded clinical conditions | code, coding system, category |
| `laboratory` | Laboratory tests and panels | category, specimen |
| `radiology` | Imaging and radiology services | category, modality |
| `medication` | Medicines and prescribable products | generic/brand name, ingredient, strength, dosage form, route |

---

## Data Model

### `catalogue_releases`

One row per imported file. A release belongs to exactly one domain.

Important fields:

- `domain`, `file_name`, `file_checksum`, `file_size`, `mime_type`, `file_type`
- `source_name`, `source_identifier`, `source_version`, `source_url`
- `status` (`draft`, `validated`, `approved`, `active`, `retired`, `failed`)
- row and classification counts (`row_count`, `valid_row_count`,
  `invalid_row_count`, `new_count`, `updated_count`, `unchanged_count`)
- `validation_result` and staged `rows`
- `imported_by`, `approved_by`, `activated_by`
- lifecycle timestamps

Only one release per domain can be `active` at a time. A partial unique index
enforces this at the database layer.

### `catalogue_resources`

One row per stable catalogue item within a release.

Important fields:

- `release_id`, `domain`, `stable_identifier`
- `code`, `name`, `description`, `coding_system`,
  `coding_system_version`, `synonyms`
- domain-specific fields (`category`, `specimen`, `modality`,
  `generic_name`, `brand_name`, `active_ingredient`, `strength`,
  `dosage_form`, `route`)
- provenance fields (`source`, `source_identifier`, `source_version`,
  `source_url`, `provenance_notes`)
- `lifecycle` (`imported`, `validated`, `active`, `inactive`, `retired`)
- `is_active`, effective dates, `metadata`

The unique key is `(release_id, domain, stable_identifier)`. Re-importing the
same stable identifier creates a new resource row in the new release instead of
mutating the old release.

### `catalogue_resource_history`

Append-only history for resource-level actions such as import, activation,
deactivation, and reactivation. It records the actor, before/after values,
reason, and time.

### Consultation snapshot tables

- `consultation_diagnoses`
- `consultation_requests` (laboratory and radiology)
- `prescriptions` (extended with catalogue snapshot columns)

Each snapshot stores the selected resource identifier, release identifier,
code/name/category/modality, source, source identifier, and release version
alongside the consultation. Later catalogue edits or releases do not rewrite
completed consultations.

`consultation_documents` records generated document metadata (type, actor,
time, checksum, item counts). The PDF bytes are generated on demand and are not
stored in the database.

---

## Import Pipeline

1. An administrator downloads the CSV template or prepares an approved XLSX/CSV
   file.
2. The administrator uploads the file and selects a domain.
3. The server parses the file, validates rows, and creates a `draft` release.
   Nothing is clinician-visible yet.
4. The administrator reviews counts, errors, warnings, unknown columns, and
   duplicate-file warnings.
5. Confirming the import stages validated resource rows and moves the release to
   `validated`. Imports with errors cannot be confirmed.
6. An administrator approves the release (`approved`).
7. An administrator activates the release (`active`). Activation retires the
   previous active release for that domain and its active resources.
8. Clinicians can search the active release immediately.

### Accepted files

- `.xlsx` and `.csv`
- Maximum 10 MB
- Maximum 10,000 data rows
- Maximum 100 columns

The Next.js server action body limit is configured to 12 MB to leave room for
multipart overhead; the parser enforces the exact 10 MB file limit.

Formulas are never executed. The parser reads cached formula results when they
exist and emits a warning; it never evaluates workbook formulas.

### Required columns

- `Resource ID` - stable identifier used for version comparison
- `Name` - display name

All other columns are optional. Unknown columns are reported as warnings.
See the templates in `next/public/catalogue-templates/`.

### Validation

Errors are row-specific and block confirmation. Examples include:

- missing required fields
- duplicate stable identifiers within a file
- duplicate source identifiers within a file
- unsupported coding system
- invalid route, date, boolean, or URL values
- effective-to date earlier than effective-from

Warnings do not block confirmation. Examples include unknown columns, ignored
formula results, and a checksum that matches an already imported file.

New/updated/unchanged classification is computed against the currently active
release for the same domain.

---

## Release Lifecycle

```
draft -> validated -> approved -> active -> retired
   \-> failed
```

Rules:

- Only a `validated` release can be approved.
- Only an `approved` release can be activated.
- Activation retires the previous `active` release for the same domain.
- Activation sets active resources to `active`, inactive resources to
  `inactive`, and leaves inactive resources out of search.
- Retiring an active release removes its resources from search. Historical
  consultation snapshots remain intact.
- Releases and resources are never deleted through the application.

Individual resources in the active release can be deactivated or reactivated by
an administrator. Each change is written to `catalogue_resource_history`.

---

## Clinical Integration

### Search

Clinicians search only active, active-release resources for the selected
domain. A search starts from the first non-whitespace character; empty or
whitespace-only queries never reach the database. The client sends a new
request as the query changes, cancels the previous request, and ignores stale
responses.

Search matches name, code, synonyms, source identifier, generic name, brand
name, active ingredient, category, specimen, and modality. Exact matches rank
first, then prefix matches, then substring matches. Results are limited to 20
and include provenance and release information.

Search is available through the clinician consultation UI, the
`searchCatalogueAction` server action, and `GET /api/catalogue/search`. The
consultation UI reuses the API route so it can cancel in-flight requests.

### Completion

`completeConsultation` validates selected resource identifiers against the
current active release inside the completion flow. It then writes, in one
transaction:

- consultation notes (`history_notes`, derived diagnosis/prescription text,
  advice, follow-up date)
- diagnosis snapshots
- laboratory and radiology request snapshots
- prescription rows with catalogue and release snapshots
- completed status and status history

If a selected resource is no longer active, completion fails and asks the
clinician to refresh and reselect. This prevents stale identifiers from being
written into clinical records.

The legacy note fields (`diagnosis`, `prescription`, `treatment`) remain for
compatibility. Structured selections are the source of truth for documents.
`treatment` is not used by the new clinician UI.

---

## Documents

Available document types:

- `prescription`
- `laboratory`
- `radiology`
- `report`
- `facesheet`

Clinical notes are clinician-only. They appear only in the clinician-facing
`report` and `facesheet`, and never in patient prescription, laboratory, or
radiology documents. Patient documents are limited to the selected structured
items and their patient-facing instructions.

Patient visibility:

| Document | Patient | Clinician (assigned) |
| --- | --- | --- |
| Prescription PDF, when prescription items exist | Yes | Yes |
| Laboratory request PDF, when laboratory requests exist | Yes | Yes |
| Radiology request PDF, when radiology requests exist | Yes | Yes |
| Complete clinical report | No | Yes |
| Medical facesheet | No | Yes |

Empty patient documents return `404`. Requesting a patient document for another
patient returns `403`. Administrators do not inherit patient/clinician document
access.

Every successful generation writes a `consultation_documents` row with the
document type, generator, timestamp, checksum, and item counts. PDF responses
use `Cache-Control: private, no-store` and `X-Content-Type-Options: nosniff`.

---

## Authorization

| Capability | Patient | Clinician | Administrator |
| --- | --- | --- | --- |
| Create consultation | Yes | No | No |
| Search active catalogue | No | Approved clinicians | Yes |
| Complete consultation | No | Assigned clinician | No |
| View own/assigned consultation | Yes | Yes | Monitoring views |
| Download patient documents | Own only, non-empty | Assigned only | No |
| Import, approve, activate, retire releases | No | No | Yes |
| Deactivate/reactivate resources | No | No | Yes |
| View import history and audit trail | No | No | Yes |

Catalogue administration actions independently enforce the administrator role
on the server. Clinician search independently checks authentication, role, and
approved clinician status.

---

## Audit and Provenance

- Imports, confirmations, approvals, activations, retirements, and resource
  activation changes are written to `audit_logs`.
- Resource-level changes are written to `catalogue_resource_history`.
- Every resource carries source and version metadata.
- Every consultation snapshot carries the catalogue source and release version
  that was active at selection time.
- Release history is listable without exposing staged rows or validation
  payloads to the admin history API.

---

## Testing

Pure tests cover validation, CSV parsing, templates, authorization rules,
document shaping, and route/action guards:

```
cd next
npm test
```

Integration tests exercise migrations, CSV/XLSX import, validation failures,
duplicate detection, release activation and supersession, resource audit
history, snapshots, database constraints, and admin listings:

```
cd next
CATALOGUE_TEST_DATABASE_URL=postgres://user@127.0.0.1:5432/catalogue_test npm run test:db
```

The integration test refuses to run against non-local databases or database
names that do not contain `test`. It resets the public schema, so never point it
at a shared or production database.

---

## Related Documents

- `02-database/database-overview.md`
- `02-database/erd.md`
- `03-api/clinical-catalogue.md`
- `04-features/consultations.md`
