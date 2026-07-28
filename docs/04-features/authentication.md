# Authentication

## Purpose

Authentication provides secure access to the OnlineDoc platform.

It allows patients, clinicians, and administrators to identify themselves and access resources based on their assigned roles.

---

## Objectives

- Secure user registration.
- Secure login.
- Session management.
- Role-based access.
- Password recovery.
- Email verification.

---

## Actors

- Patient
- Clinician
- Administrator

---

## User Stories

### Patient

As a patient, I want to:

- Create an account.
- Verify my email address.
- Log in securely.
- Reset my password.
- Update my profile.
- Log out.

### Clinician

As a clinician, I want to:

- Log in.
- Access my dashboard.
- Update my profile.
- Change my password.

### Administrator

As an administrator, I want to:

- Manage user accounts.
- Activate or deactivate users.
- Assign user roles.

---

## Workflow

Registration

↓

Email Verification

↓

Login

↓

Authenticated Session

↓

Access Dashboard

↓

Logout

---

## Business Rules

- Every account must have a unique email address.
- Passwords must never be stored in plain text.
- Email verification is required before accessing protected features.
- Every authenticated user has exactly one role.
- Protected pages require authentication.

---

## Screens

Public

- Register
- Login
- Forgot Password
- Reset Password
- Verify Email

Authenticated

- Profile
- Account Settings

---

## Related APIs

- Authentication
- Users

---

## Related Database Entities

- User
- Patient Profile
- Clinician Profile

---

## Future Improvements

- Multi-factor Authentication
- Social Login
- Passkeys
- Single Sign-On