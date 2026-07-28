# Notification Contract

## Purpose

Defines how the platform delivers important information to users.

---

## Actors

- Patient
- Clinician
- Administrator

---

## Objective

Notify users about important events.

---

## Trigger Events

- Consultation Created
- Consultation Accepted
- New Message
- Payment Successful
- Order Completed

---

## Output

The backend delivers a notification through one or more supported channels.

---

## Business Rules

- Notifications are generated automatically by business events.
- Users receive only notifications relevant to their account.
- Notification history should remain available to the user.

---

## Related Documents

- ../01-architecture/domain-model.md