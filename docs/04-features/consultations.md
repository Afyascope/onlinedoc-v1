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
- Complete consultations.

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

Administrator

- Consultation Management

---

## Related APIs

- Consultations
- Conversations
- Payments

---

## Related Database Entities

- Consultation
- Conversation
- Patient
- Clinician

---

## Future Improvements

- Audio Consultation
- Video Consultation
- Clinical Notes
- Prescriptions
- Referrals
- Laboratory Requests