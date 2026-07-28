# Folder Structure

## Purpose

This document defines the folder structure of the OnlineDoc repository.

A consistent folder structure improves maintainability, scalability, and developer experience.

Every directory has a single responsibility.

---

# Repository Structure

OnlineDoc/

├── apps/                                       
├── services/                                   
├── packages/                                   
├── docs/                                       
├── references/                                   
├── infrastructure/                             
├── scripts/                                    
├── .github/                                    
├── package.json                                
├── pnpm-workspace.yaml                           
├── turbo.json                                  
├── README.md                               
└── LICENSE                                     

---

# apps/

Contains all user-facing applications.

Current

apps/

    web/

Future

apps/

    admin/
    mobile/

---

## apps/web

The primary frontend application built with Next.js.

Responsibilities

- Landing Website
- Authentication
- Patient Dashboard
- Clinician Dashboard
- Consultation Interface
- Chat Interface
- Digital Product Store

---

# services/

Contains backend services.

Current

services/

    cms/

Future

services/

    api/
    notifications/
    ai/
    analytics/
    video/

---

## services/cms

The Strapi application.

Responsibilities

- Authentication
- Content Management
- Consultation APIs
- User Management
- Orders
- Payments
- Media Library

---

# packages/

Contains reusable code shared across applications.

packages/

    ui/
    types/
    config/
    utils/

---

## packages/ui

Reusable user interface components.

Examples

- Buttons
- Forms
- Dialogs
- Cards
- Layout Components

---

## packages/types

Shared TypeScript types.

Examples

- User
- Patient
- Clinician
- Consultation
- Message
- Payment
- Order

---

## packages/config

Shared configuration.

Examples

- ESLint
- Prettier
- TypeScript
- Tailwind
- Environment Configuration

---

## packages/utils

Shared helper functions.

Examples

- Date Formatting
- Currency Formatting
- Validation
- File Helpers

---

# docs/

Contains all project documentation.

Documentation is written before implementation.

---

# references/

Contains external reference material.

Examples

- Framework Documentation
- Software Engineering Notes
- Healthcare Guidelines
- AI References

---

# infrastructure/

Contains infrastructure-related configuration.

Examples

- Docker
- Deployment
- Reverse Proxy
- Monitoring

---

# scripts/

Contains project automation scripts.

Examples

- Project Setup
- Database Seeding
- Backup Scripts
- Maintenance Scripts

---

# .github/

Contains GitHub configuration.

Examples

- GitHub Actions
- Issue Templates
- Pull Request Templates
- CODEOWNERS

---

# Root Files

## README.md

Introduces the project.

---

## package.json

Defines workspace dependencies and scripts.

---

## pnpm-workspace.yaml

Defines the pnpm workspace.

---

## turbo.json

Defines Turborepo configuration.

---

## LICENSE

Project license.

---

# Folder Ownership

Folder                 Responsibility

apps/                  User-facing applications

services/              Backend services

packages/              Shared code

docs/                  Project documentation

references/            External knowledge

infrastructure/        Infrastructure configuration

scripts/               Automation

.github/               Repository automation

---

# Future Expansion

The repository is designed to grow without requiring structural changes.

New applications, services, or packages should be added only when they provide a clear architectural benefit.

The existing structure should remain stable throughout the lifetime of the project.
