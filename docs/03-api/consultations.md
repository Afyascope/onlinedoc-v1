# Consultation Contract

## Purpose

Defines the interaction between the frontend and backend for managing patient consultations.

This contract represents the primary business workflow of OnlineDoc.

---

## Actors

- Patient
- Clinician
- Administrator

---

## Objective

Allow a patient to request a professional medical consultation, allow an
approved clinician to claim and complete it, and allow the patient to review the
completed record.

---

## Input

The frontend provides:

- Consultation Type
- Selected Service
- Optional Initial Message

---

## Output

The backend returns:

- Consultation Identifier
- Consultation Status
- Creation Time
- Assigned Clinician (when available)

---

## Business Rules

- The user must be authenticated.
- The selected consultation service must be active.
- Payment must be completed before consultation begins.
- Every consultation belongs to exactly one patient.
- Every consultation is assigned to one clinician.
- Every consultation owns one conversation.

---

## State Transitions

```
draft -> awaiting_payment -> paid -> waiting_for_clinician -> in_consultation -> completed
                                                                             \-> follow_up_required
completed -> closed
follow_up_required -> in_consultation | closed
```

Patients may initiate `awaiting_payment`. Clinicians drive the active and
completion transitions. Patients cannot perform clinician transitions.

---

## Claim a Consultation

### `claimConsultation(consultationId)`

An approved clinician may claim a paid, unassigned consultation. The update is
conditional (paid, unassigned, no concurrent claim), records status history, and
notifies the clinician. A failed claim returns a user-safe error instead of
overwriting another clinician's claim.

---

## Complete a Consultation

### `completeConsultation(consultationId, data)`

The assigned clinician may complete a consultation only while it is
`in_consultation`.

The request may contain:

- `historyNotes`, `advice`, `followUpDate`
- `diagnoses[]`
- `laboratoryRequests[]`
- `radiologyRequests[]`
- `prescriptions[]` with dosage and standardized frequency

Business rules:

- Selected catalogue resources must be in the active release at completion time.
- Prescription dosage and frequency are required. New frequency values must be
  one of `OD`, `BD`, `TID`, `QID`, `PRN`, `STAT`, `Nocte`, `Weekly`, or
  `Monthly`. Existing legacy free-text rows stay unchanged.
- Repeated resource identifiers are ignored; at most 50 selections per category.
- Notes, snapshots, prescriptions, status, and status history are committed in
  one transaction.
- Catalogue snapshots preserve the source, source identifier, and release
  version visible at selection time.
- A completed consultation cannot be completed again.
- Direct status changes to `completed` are rejected; only this action may
  complete a consultation, so the snapshot rows are always written.
- Notes cannot be edited after a consultation is `completed` or `closed`.
- Input lengths are bounded: history notes 10,000 characters, advice 4,000,
  selection notes 1,000, prescription dosage/frequency 200, duration/route/form
  100, and prescription instructions 2,000.
- Clinical notes are returned only to the assigned clinician. Patient
  consultation views and patient-accessible documents never receive them.
- Patient consultation list and detail responses never include structured
  diagnoses, investigation requests, prescription entries, selection notes, or
  intake clinical fields. Document availability is returned only as booleans.

See `clinical-catalogue.md` for the catalogue search contract.

---

## Documents

`GET /api/documents/consultation/{id}/{type}` returns a PDF for:

- `prescription`
- `laboratory`
- `radiology`
- `report`
- `facesheet`

Patients may access only their own populated `prescription`, `laboratory`, and
`radiology` documents. The assigned clinician may access all five types.
Patients never receive `report` or `facesheet`. Empty patient documents return
`404`; unauthorized access returns `403`.

---

## Related Documents

- ../01-architecture/domain-model.md
- ../02-database/erd.md
- clinical-catalogue.md
- ../04-features/consultations.md