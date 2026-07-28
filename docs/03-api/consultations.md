# Consultation Contract

## Purpose

Defines the interaction between the frontend and backend for managing patient consultations.

This contract represents the primary business workflow of OnlineDoc.

---

## Actor

Patient

---

## Objective

Allow a patient to request professional medical consultation.

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

Pending

↓

Accepted

↓

Active

↓

Completed

Possible exit states

- Cancelled
- Expired (Future)

---

## Related Documents

- ../01-architecture/domain-model.md
- ../02-database/erd.md