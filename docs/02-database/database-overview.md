# Database Overview

## Purpose

This document describes the overall database architecture of OnlineDoc.

It defines how application data is organized and the principles used when designing the database.

Detailed definitions of individual entities are documented separately.

---

# Database Engine

OnlineDoc uses PostgreSQL as its primary relational database.

The database is designed to support transactional consistency, scalability, and future platform growth.

---

# Database Objectives

The database should:

- Maintain data integrity.
- Support secure healthcare records.
- Minimize data duplication.
- Support efficient querying.
- Allow future expansion without structural redesign.

---

# Data Organization

The database is organized into logical business domains.

- Identity
- Consultations
- Clinical Catalogue
- Communication
- Commerce
- Content
- Platform

Each domain contains related entities with clearly defined relationships.

---

# Identity Domain

Responsible for user identity and access.

Includes:

- Users
- Patient Profiles
- Clinician Profiles

---

# Consultation Domain

Responsible for healthcare interactions.

Includes:

- Consultations
- Consultation Notes (including History Notes)
- Consultation Diagnoses
- Consultation Requests (laboratory and radiology)
- Prescriptions
- Consultation Documents
- Consultation Status History

Structured clinical selections store immutable snapshots of catalogue values,
source metadata, and release versions so historical records are not rewritten
when catalogues change.

---

# Clinical Catalogue Domain

Responsible for approved clinical terminology used during consultations.

Includes:

- Catalogue Releases
- Catalogue Resources
- Catalogue Resource History

The catalogue lives in PostgreSQL, not Strapi. Four domains are supported:
diagnosis, laboratory, radiology, and medication. Each domain has at most one
active release; imports are staged, validated, approved, and activated before
clinicians can search them. See `../04-features/clinical-catalogue.md`.

---

# Communication Domain

Responsible for communication during consultations.

Includes:

- Conversations
- Messages

---

# Commerce Domain

Responsible for purchases and payments.

Includes:

- Orders
- Payments
- Digital Products
- Categories

---

# Content Domain

Managed through Strapi.

Includes:

- Blog Articles
- Health Articles
- FAQs
- Static Pages
- Platform Settings

---

# Platform Domain

Supports platform operation.

Includes:

- Notifications
- Audit Logs (future)

---

# Database Principles

The database follows these principles.

- One source of truth.
- Normalize data where appropriate.
- Avoid duplicate records.
- Preserve historical information.
- Use relationships instead of repeated values.
- Design for future expansion.
- Keep clinical catalogue data in PostgreSQL and version it through releases.
- Snapshot clinical selections instead of relying on mutable catalogue rows.
- Keep generated document metadata separate from on-demand PDF bytes.

---

# Related Documents

- ../01-architecture/domain-model.md
- entities.md
- relationships.md
- naming-conventions.md