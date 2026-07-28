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
- Consultation Notes (future)

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

---

# Related Documents

- ../01-architecture/domain-model.md
- entities.md
- relationships.md
- naming-conventions.md