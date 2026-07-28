# Monorepo Architecture

## Purpose

This document defines the repository structure of the OnlineDoc platform.

The repository is designed to support long-term growth while maintaining a clear separation of responsibilities.

Every directory in the repository must exist for a specific reason.

New directories should only be introduced when they provide measurable value.

---

# Why a Monorepo?

OnlineDoc is a single product composed of multiple applications and shared packages.

A monorepo allows all applications to share:

- Types
- UI Components
- Configuration
- Utilities
- Documentation
- Development Standards

Benefits

- Single source of truth
- Easier dependency management
- Shared code
- Consistent tooling
- Simpler deployments
- Easier onboarding
- Better developer experience

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
├── README.md                                                                                                                             
├── package.json                                                                                                                         
├── pnpm-workspace.yaml                                                                                                                   
└── turbo.json                                                                                                                          

---

# apps/

Contains user-facing applications.

Applications are responsible for presentation only.

Business logic belongs to backend services.

Current Applications

apps/

web/

Future Applications

apps/

admin/

mobile/

doctor/

patient/

---

## apps/web

Technology

Next.js

Purpose

Patient-facing application.

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

Every service owns a specific responsibility.

Current

services/

cms/

Future

services/

api/

notifications/

ai/

video/

analytics/

---

## services/cms

Technology

Strapi

Purpose

Primary backend during Phase 1.

Responsibilities

- Authentication
- Users
- Consultations
- Products
- Orders
- Payments
- CMS
- File Uploads

---

## services/api

Status

Future

Technology

NestJS

Purpose

Business services that exceed the responsibilities of the CMS.

Examples

- Video Consultations
- AI Services
- Background Jobs
- Queue Processing
- WebSockets
- Notification Engine

---

# packages/

Contains reusable code shared across applications.

Packages must remain framework-independent whenever possible.

Current Packages

packages/

ui/

types/

config/

utils/

---

## packages/ui

Shared design system.

Examples

- Buttons
- Forms
- Cards
- Dialogs
- Navigation
- Layout Components

---

## packages/types

Shared TypeScript types.

Examples

Patient

Consultation

Message

Payment

Digital Product

---

## packages/config

Shared configuration.

Examples

ESLint

Prettier

TypeScript

Tailwind

---

## packages/utils

Reusable utility functions.

Examples

Date formatting

Currency formatting

Validation

Helper functions

---

# docs/

Project documentation.

This directory is the primary source of truth.

Documentation is written before implementation.

---

# references/

External knowledge.

Examples

- Framework notes
- Healthcare references
- Engineering notes
- AI workflows

Nothing inside references should be treated as project documentation.

---

# infrastructure/

Infrastructure configuration.

Examples

Docker

CI/CD

Deployment

Monitoring

Reverse Proxy

Future Kubernetes configuration

---

# scripts/

Automation scripts.

Examples

Development setup

Database seeding

Deployment scripts

Migration helpers

Maintenance tasks

---

# .github/

Repository automation.

Examples

GitHub Actions

Issue Templates

Pull Request Templates

CODEOWNERS

---

# Repository Principles

Every directory has a single responsibility.

Applications do not own business logic.

Services do not own presentation.

Packages do not own application state.

Documentation remains separate from implementation.

Infrastructure remains separate from application code.

---

# Growth Strategy

Phase 1

apps/

web/

services/

cms/

Phase 2

services/

api/

notifications/

Phase 3

apps/

mobile/

services/

video/

ai/

analytics/

The repository should expand without requiring restructuring.

---

# Adding New Applications

Before creating a new application, answer the following questions.

Does this application serve a new user?

Does it require its own deployment?

Does it justify independent ownership?

If the answer is no, it probably belongs inside an existing application.

---

# Adding New Packages

A package should only be created when functionality is shared by multiple applications.

Avoid creating packages prematurely.

---

# Long-Term Goal

The repository should remain understandable after years of continuous development.

A new developer should understand the project structure within minutes by reading this document.
