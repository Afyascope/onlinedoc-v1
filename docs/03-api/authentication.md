# Authentication Contract

## Purpose

Defines user authentication and access to the OnlineDoc platform.

---

## Actors

- Patient
- Clinician
- Administrator

---

## Objective

Provide secure access to protected platform resources.

---

## Input

The frontend provides:

- Registration Information
- Login Credentials

---

## Output

The backend returns:

- Authenticated Session
- User Information
- Assigned Role

---

## Business Rules

- Users must authenticate before accessing protected resources.
- Access is determined by user role.
- Sessions expire after a defined period.
- Password recovery requires identity verification.

---

## Related Documents

- ../01-architecture/domain-model.md