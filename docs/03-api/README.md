# API Contracts

## Purpose

This directory defines the contracts between the frontend and backend.

An API contract describes what information is exchanged between different parts of the system without prescribing how that exchange is implemented.

These contracts remain stable even if the underlying implementation changes.

Examples of implementation changes include:

- REST to GraphQL
- Strapi to NestJS
- API versioning
- Internal service restructuring

The goal is to ensure that business requirements remain independent of implementation details.

---

## Principles

- Contracts describe business capabilities.
- Contracts do not describe framework implementation.
- Contracts define expected inputs and outputs.
- Contracts define business rules.
- Contracts define responsibilities.
- Implementation details belong with the codebase.

---

## Current Contracts

Phase 1 includes the following contracts.

- Authentication
- Consultations
- Conversations
- Messages
- Digital Products
- Orders
- Payments
- Notifications

Additional contracts will be added as the platform grows.