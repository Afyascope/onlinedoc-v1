# Consultations

## Purpose

The Consultation feature enables patients to receive healthcare services from licensed clinicians through secure online consultations.

This is the core feature of OnlineDoc.

---

## Objectives

- Create consultations.
- Assign clinicians.
- Track consultation status.
- Maintain consultation history.
- Support multiple consultation types.

---

## Actors

- Patient
- Clinician
- Administrator

---

## User Stories

### Patient

As a patient, I want to:

- Start a consultation.
- Choose a consultation type.
- View consultation status.
- View consultation history.

### Clinician

As a clinician, I want to:

- View assigned consultations.
- Accept consultations.
- Search the active clinical catalogue while consulting.
- Record structured diagnoses, laboratory and radiology requests, and
  prescriptions.
- Complete consultations and generate documents.

### Administrator

As an administrator, I want to:

- Monitor consultations.
- View consultation statistics.

---

## Consultation Types

Phase 1

- Chat Consultation
- Follow-up Consultation
- Urgent Consultation

Future

- Audio Consultation
- Video Consultation

---

## Workflow

Patient

↓

Select Consultation Type

↓

Payment

↓

Consultation Created

↓

Clinician Assigned

↓

Consultation Accepted

↓

Conversation Opens

↓

Consultation Completed

---

## Business Rules

- Patient must be authenticated.
- Consultation requires payment.
- Every consultation belongs to one patient.
- Every consultation is assigned to one clinician.
- Every consultation has one conversation.
- Consultation history cannot be deleted.
- Completion requires an approved, assigned clinician and an `in_consultation`
  status.
- Structured catalogue selections must reference resources in the active
  release at completion time.
- Completed consultations keep immutable catalogue snapshots even if the
  catalogue is later revised or retired.
- Clinical notes (history, examination, assessment, advice, and internal
  comments) are clinician-only. They are never rendered on patient consultation
  pages or in patient-accessible PDFs.
- Patient consultation pages show administrative details only: status,
  consultation date, fee/payment status, follow-up date, attachments, and links
  to patient-facing PDFs. They do not render or serialize diagnoses, structured
  investigation requests, structured prescription entries, intake clinical
  history, or clinician notes.

---

## Screens

Patient

- New Consultation
- Consultation History
- Consultation Details

Clinician

- Consultation Queue
- Active Consultations
- Consultation Details
- Structured completion form with catalogue search
- Document downloads for the assigned clinician

Administrator

- Consultation Management

---

## Structured Clinical Record

During a consultation, the clinician can select:

- Diagnoses from the active diagnosis catalogue.
- Laboratory tests from the active laboratory catalogue.
- Radiology services from the active radiology catalogue.
- Medications from the active medication catalogue, with dosage, form,
  frequency, duration, route, and instructions. New prescriptions use the
  standardized frequency values `OD`, `BD`, `TID`, `QID`, `PRN`, `STAT`,
  `Nocte`, `Weekly`, and `Monthly`; legacy free-text values remain readable.

Each selection stores both the resource identifier and a snapshot of the values
that were visible at selection time, including source and release version.
This protects historical records from later catalogue updates.

Completion writes the notes, structured selections, prescriptions, completed
status, and status history in one transaction. If a selected resource has been
deactivated or replaced, completion fails and the clinician must reselect it.

## Documents

Patients can download their own prescription, laboratory request, and radiology
request PDFs when those items exist. The assigned clinician can additionally
download the complete clinical report and medical facesheet.

Patient prescription, laboratory, and radiology PDFs never include clinical
notes, selection notes, or a Clinical Summary. The clinician-only clinical
report and medical facesheet are the only document types that include those
notes. Patients never receive the report or facesheet through the document
route.

## Related APIs

- Consultations
- Clinical Catalogue
- Conversation
- Payments

---

## Related Database Entities

- Consultation
- Consultation Notes
- Consultation Diagnoses
- Consultation Requests
- Prescription
- Catalogue Release
- Catalogue Resource
- Consultation Document
- Conversation
- Patient
- Clinician

---

## Related Documents

- ../04-features/clinical-catalogue.md
- ../03-api/clinical-catalogue.md

---

## Future Improvements

- Audio Consultation
- Video Consultation
- Referrals