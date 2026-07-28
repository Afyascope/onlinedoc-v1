# Order Contract

## Purpose

Defines how purchases are managed within OnlineDoc.

---

## Actor

Patient

---

## Objective

Create and manage purchases for consultations and digital products.

---

## Input

The frontend provides:

- Selected Item
- Payment Method

---

## Output

The backend returns:

- Order Identifier
- Order Status
- Payment Status

---

## Business Rules

- Every order belongs to one patient.
- Every order requires a payment.
- Orders become active only after successful payment.
- Orders cannot exist without a purchasable item.

---

## Related Documents

- ../01-architecture/domain-model.md
- ../02-database/erd.md