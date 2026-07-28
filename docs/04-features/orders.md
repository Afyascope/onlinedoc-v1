# Orders

## Purpose

Manage purchases made on the platform.

---

## Objectives

- Create orders.
- Track order status.
- Connect payments with purchases.

---

## Actors

- Patient
- Administrator

---

## User Stories

### Patient

As a patient, I want to:

- View my orders.
- Check payment status.
- Access purchased items.

### Administrator

As an administrator, I want to:

- Monitor orders.
- Resolve order issues.

---

## Workflow

Select Item

↓

Create Order

↓

Payment

↓

Order Completed

---

## Business Rules

- Every order belongs to one patient.
- Every order requires one payment.
- Orders cannot be edited after completion.

---

## Screens

- Order History
- Order Details

---

## Related APIs

- Orders
- Payments

---

## Related Database Entities

- Order
- Payment

---

## Future Improvements

- Refunds
- Coupons
- Promotions