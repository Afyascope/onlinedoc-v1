# Database Naming Conventions

## Purpose

This document defines the naming conventions used throughout the OnlineDoc database.

Consistent naming improves readability and maintainability.

---

# General Rules

- Use lowercase.
- Use snake_case.
- Use singular names for entities in documentation.
- Use plural names for database tables.
- Avoid abbreviations unless universally understood.

---

# Tables

Examples

users

patient_profiles

clinician_profiles

consultations

conversations

messages

orders

payments

digital_products

categories

notifications

---

# Primary Keys

Every table uses

id

Example

id

---

# Foreign Keys

Foreign keys follow the pattern

entity_id

Examples

user_id

patient_id

clinician_id

consultation_id

conversation_id

order_id

payment_id

category_id

---

# Timestamp Columns

Every table should include

created_at

updated_at

Optional

deleted_at

---

# Boolean Columns

Use positive names.

Examples

is_active

is_verified

is_featured

Avoid

active

status_flag

flag

---

# Enum Values

Store enum values using uppercase.

Examples

PENDING

ACTIVE

COMPLETED

FAILED

CANCELLED

---

# File Names

Use kebab-case.

Examples

consultation-service.ts

payment-controller.ts

digital-product.ts
