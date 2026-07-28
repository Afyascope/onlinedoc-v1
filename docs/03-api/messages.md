# Message Contract

## Purpose

Defines how messages are exchanged within a consultation.

---

## Actors

- Patient
- Clinician

---

## Objective

Allow secure communication between a patient and the assigned clinician.

---

## Input

The frontend provides:

- Conversation Identifier
- Message Content
- Optional Attachment

---

## Output

The backend returns:

- Message Identifier
- Delivery Status
- Timestamp
- Sender Information

---

## Business Rules

- A message belongs to exactly one conversation.
- A conversation must exist before a message can be created.
- Only participants of the consultation may send messages.
- Messages cannot be modified after delivery.
- Messages become part of the consultation history.

---

## Related Documents

- ../01-architecture/domain-model.md
- ../02-database/erd.md