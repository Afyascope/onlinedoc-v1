# Database Migration Strategy

## Purpose

This document defines how database schema changes are managed throughout the lifecycle of OnlineDoc.

---

# Principles

- Every schema change must be version controlled.
- Schema changes should be repeatable.
- Production databases must never be modified manually.
- Migrations should be reversible whenever possible.

---

# Development

During development, schema changes should be applied through migration files.

Developers should keep local databases synchronized with the latest migrations.

---

# Testing

All migrations should be tested before deployment.

A migration should be applied to a clean database to verify correctness.

---

# Production

Before applying any migration:

- Create a database backup.
- Review migration changes.
- Verify compatibility with the current application version.

---

# Rollback

If a migration introduces unexpected issues:

- Restore the latest backup if necessary.
- Apply the rollback procedure where supported.
- Document the incident before creating a replacement migration.

---

# Version Control

Migration files are part of the repository.

Every migration should have a clear, descriptive name that reflects its purpose.
