# OnlineDoc System Overview

## Purpose

This document provides a high-level overview of the OnlineDoc platform.

It describes the major system components, how they interact, and the responsibilities of each component.

This document is intentionally technology-agnostic where possible. Detailed implementation decisions are documented elsewhere.

---

# System Vision

OnlineDoc is a digital healthcare platform that enables patients to securely access healthcare professionals through online consultations while providing digital health education and other healthcare services.

The system is designed using a modular architecture so new healthcare services can be added without changing the existing foundation.

---

# High-Level Architecture

                    Internet
                        │
                        │
         ┌──────────────┴──────────────┐
         │                             │
     Patients                    Clinicians
         │                             │
         └──────────────┬──────────────┘
                        │
                  Next.js Frontend
                        │
               REST API (Phase 1)
                        │
                     Strapi CMS
                        │
                   PostgreSQL
                        │
              External Integrations
                        │
      Payments • Email • SMS • Storage

---

# Core Components

## Frontend

Technology

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

Responsibilities

- User interface
- Authentication
- Dashboards
- Consultation screens
- Chat interface
- Digital product store
- Payment flow

The frontend contains no business logic.

Business rules remain on the backend.

---

## Backend

Technology

- Strapi 5

Responsibilities

- Authentication
- Authorization
- Content Management
- Consultation APIs
- Digital Product APIs
- User Management
- Orders
- Payments
- Notifications

Future versions may introduce dedicated backend services without affecting the frontend.

---

## Database

Technology

- PostgreSQL

Responsibilities

- Store all application data
- Maintain relationships
- Ensure data integrity
- Support reporting
- Maintain audit history

---

## Administration

The administration portal is powered by Strapi.

Responsibilities

- Manage users
- Manage consultations
- Publish health articles
- Manage digital booklets
- View reports
- Configure platform settings

---

# Primary Users

The platform supports multiple user roles.

## Patient

Can

- Register
- Login
- Purchase consultations
- Chat with clinicians
- Purchase booklets
- View consultation history
- Manage profile

---

## Clinician

Can

- Accept consultations
- Communicate with patients
- Complete consultations
- View patient history
- Update availability

---

## Administrator

Can

- Manage users
- Moderate consultations
- Publish content
- Configure services
- View reports

---

# Initial Modules

Phase 1 includes the following modules.

- Authentication
- Patient Management
- Clinician Management
- Consultation Module
- Chat Module
- Digital Products
- Orders
- Payments
- Notifications
- CMS

Future modules will be added without changing the overall architecture.

---

# External Integrations

Phase 1

- Email
- M-Pesa
- Pesapal
- File Storage

Future

- SMS
- Push Notifications
- Video Calls
- AI Services
- Insurance APIs
- Laboratory Systems

---

# Architectural Principles

The platform follows these principles.

- Documentation First
- Modular Design
- Separation of Concerns
- Single Responsibility
- API First
- Security by Design
- Scalability
- Maintainability

Every new feature must follow these principles.

---

# Future Growth

The architecture is intentionally designed to support future expansion.

Future services include

- Video Consultation
- Audio Consultation
- Electronic Medical Records
- Pharmacy
- Laboratory
- AI Clinical Assistant
- Remote Patient Monitoring
- Insurance Integration

These additions should require minimal changes to the existing architecture.
