# Clinical Catalogue Contract

## Purpose

Defines the catalogue search and consultation document capabilities used by
clinicians, patients, and administrators.

Catalogue administration is implemented as authenticated Next.js server
actions; it is not a public REST API.

---

## Catalogue Search

### `searchCatalogueAction(domain, query)`

Server action used by the clinician consultation UI.

Input:

- `domain`: `diagnosis`, `laboratory`, `radiology`, or `medication`
- `query`: at least 1 non-whitespace character after trimming; an empty query
  returns an empty list without querying the database

Output: up to 20 active resources with code, name, description, category,
domain-specific fields, provenance, release identifier, and release version.
Exact matches rank before prefix matches, which rank before substring matches.
Matching covers name, code, synonyms, source identifier, generic name, brand
name, active ingredient, category, specimen, and modality.

Authorization:

- Authenticated user required.
- Allowed roles: approved clinician or administrator.
- Patients receive `Forbidden`.

### `GET /api/catalogue/search`

Query parameters:

- `domain` (required)
- `q` (required for results; an empty or whitespace-only value returns an empty
  list without querying the database)

Responses:

| Status | Meaning |
| --- | --- |
| `200` | `{ results: [...] }` |
| `400` | Unsupported or missing domain |
| `401` | Not authenticated |
| `403` | Role not allowed or clinician not approved |
| `503` | Catalogue search temporarily unavailable (sanitized database error) |

Only resources in the domain's active release, with lifecycle `active` and
`is_active = true`, are returned.

---

## Consultation Completion

### `completeConsultation(consultationId, data)`

Server action used by the assigned clinician.

Input may include:

- `historyNotes`, `advice`, `followUpDate`
- `diagnoses[]` with `resourceId`, optional `notes`
- `laboratoryRequests[]` with `resourceId`, optional `notes`
- `radiologyRequests[]` with `resourceId`, optional `notes`
- `prescriptions[]` with `resourceId`, `dosage`, standardized `frequency`,
  optional `dosageForm`, `duration`, `route`, `instructions`

Business rules:

- Caller must be an approved clinician and the assigned clinician.
- Consultation must be `in_consultation`.
- Every selected resource must still be in the active release and active.
- Prescription dosage and frequency are required. New frequency values must be
  one of `OD`, `BD`, `TID`, `QID`, `PRN`, `STAT`, `Nocte`, `Weekly`, or
  `Monthly`; legacy free-text values are displayed unchanged.
- Duplicate resource identifiers are ignored.
- Maximum 50 selections per category.
- Completion is transactional. Notes, snapshot rows, prescriptions, status, and
  status history are written together.
- Snapshot rows preserve the selected catalogue values and release version.
- Completed consultations cannot be completed again.

---

## Consultation Documents

### `GET /api/documents/consultation/{consultationId}/{type}`

`type` is one of:

- `prescription`
- `laboratory`
- `radiology`
- `report`
- `facesheet`

Responses:

| Status | Meaning |
| --- | --- |
| `200` | `application/pdf` |
| `401` | Not authenticated |
| `403` | Authenticated but not allowed to access this document |
| `404` | Unknown type, unknown consultation, or empty patient document |

Authorization rules:

- Assigned clinician may access all five document types.
- Patient may access only their own `prescription`, `laboratory`, and
  `radiology` documents, and only when at least one item of that type exists.
- Patients may not access `report` or `facesheet`.
- Administrators and unassigned clinicians do not receive patient/clinician
  document access through this route.

Content rules:

- Clinical notes are loaded only after document authorization succeeds and only
  for clinician-only `report` and `facesheet` documents.
- Patient prescription, laboratory, and radiology documents contain only the
  selected structured items. They never include clinical notes, selection
  notes, or a Clinical Summary.
- Unknown document types are rejected before any document is rendered.
- Successful generation records metadata in `consultation_documents`.
- PDF responses are private and non-cacheable.

---

## Administration

Catalogue administration is available only to authenticated administrators
through server actions:

- `previewCatalogueImportAction(formData)`
- `confirmCatalogueImportAction(releaseId)`
- `approveCatalogueReleaseAction(releaseId)`
- `activateCatalogueReleaseAction(releaseId)`
- `retireCatalogueReleaseAction(releaseId, reason?)`
- `listCatalogueResourcesAction(filters)`
- `setCatalogueResourceActiveAction(input)`
- `getCatalogueResourceHistoryAction(resourceId)`
- `getCatalogueAdminOverview()`
- `getCatalogueImportHistory(domain?)`

Every action independently verifies the administrator role on the server. See
`04-features/clinical-catalogue.md` for the lifecycle and validation rules.

---

## Related Documents

- `04-features/clinical-catalogue.md`
- `04-features/consultations.md`
- `02-database/erd.md`
