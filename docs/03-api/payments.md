# Payment Contract

## Purpose

Defines how payments are processed within OnlineDoc.

---

## Actor

Patient

---

## Objective

Allow secure payment for consultations and digital products.

---

## Input

The frontend provides:

- Order Identifier
- Payment Method

---

## Output

The backend returns:

- Payment Identifier
- Payment Status
- Transaction Reference

---

## Business Rules

- Every payment belongs to one order.
- Payments must be verified before services are activated.
- Failed payments do not activate orders.
- Payment records remain available for auditing.

---

## Related Documents

- ../01-architecture/domain-model.md