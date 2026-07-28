# Conversation Contract

## Purpose

Defines the communication channel used during a consultation.

---

## Actor

Patient

Clinician

---

## Objective

Provide secure communication throughout the consultation.

---

## Input

A consultation identifier.

---

## Output

A conversation associated with the consultation.

---

## Business Rules

- A conversation cannot exist without a consultation.
- A consultation owns exactly one conversation.
- Only participants of the consultation may access the conversation.
- Messages remain part of the consultation history.

---

## Related Documents

- ../01-architecture/domain-model.md
- ../02-database/erd.md