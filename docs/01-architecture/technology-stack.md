# Technology Stack

## Purpose

This document defines the technologies used to build OnlineDoc.

Each technology is selected to support scalability, maintainability, developer productivity, and long-term sustainability.

Technology choices should only change through an Architecture Decision Record (ADR).

---

# Architecture Overview

OnlineDoc follows a modular web architecture.

Frontend

↓

Backend

↓

Database

↓

External Services

↓

Infrastructure

---

# Frontend

## Next.js

Purpose

Build the patient-facing website and application.

Responsibilities

- Landing website
- Patient Dashboard
- Clinician Dashboard
- Authentication
- Chat Interface
- Digital Product Store
- Responsive UI

Why Next.js?

- Production-ready React framework
- Server Components
- App Router
- Excellent SEO
- Fast performance
- Built-in optimization
- Large ecosystem
- Excellent Vercel support

Alternatives Considered

- React + Vite
- Remix
- Angular
- Vue

Decision

Next.js provides the best balance between developer experience and production readiness.

---

# Backend

## Strapi 5

Purpose

Serve as the primary backend during Phase 1.

Responsibilities

- Authentication
- Authorization
- User Management
- Consultation APIs
- CMS
- Digital Products
- Orders
- Payments
- Media Library

Why Strapi?

- Open Source
- Headless CMS
- Extensible
- Excellent admin panel
- REST and GraphQL support
- Role-based permissions
- Active community

Alternatives Considered

- Directus
- Payload CMS
- KeystoneJS
- Custom NestJS Backend

Decision

Strapi provides the fastest path to a production-ready healthcare platform while remaining flexible enough to support future growth.

---

# Future Backend

## NestJS

Status

Planned

Purpose

Support advanced business logic when the application grows.

Examples

- Video consultations
- AI services
- Real-time messaging
- Background jobs
- Scheduling
- Queue processing
- Notification services

NestJS will only be introduced when the additional complexity provides measurable value.

---

# Database

## PostgreSQL

Purpose

Primary relational database.

Responsibilities

- User data
- Consultations
- Chat
- Orders
- Payments
- Digital Products
- Reports

Why PostgreSQL?

- Mature
- Reliable
- ACID compliant
- Excellent relational support
- Strong indexing
- JSON support
- Widely supported

Alternatives

- MySQL
- MariaDB
- MongoDB

Decision

Healthcare data is highly relational.

PostgreSQL provides excellent consistency and reliability.

---

# Styling

## Tailwind CSS

Purpose

Application styling.

Why?

- Utility-first
- Consistent
- Fast development
- Easy customization
- Excellent performance

Alternatives

- Bootstrap
- Material UI
- Chakra UI

Decision

Tailwind gives complete design freedom.

---

# Component Library

## shadcn/ui

Purpose

Reusable application components.

Examples

- Forms
- Tables
- Dialogs
- Inputs
- Navigation
- Cards

Why?

- Accessible
- Fully customizable
- Components become part of our codebase
- Excellent TypeScript support

Decision

Forms the foundation of the application interface.

---

# Landing Page Components

## Aceternity UI

Purpose

Enhance marketing pages.

Used For

- Hero Sections
- Feature Sections
- Testimonials
- Call-to-actions
- Animations

Not used inside dashboards.

---

# Authentication

## Better Auth

Purpose

Authentication and session management.

Responsibilities

- Login
- Registration
- Sessions
- Password Reset
- Email Verification

Why?

- Modern
- Flexible
- Type-safe
- Framework agnostic
- Excellent developer experience

Alternatives

- Auth.js
- Clerk
- Firebase Authentication

Decision

Better Auth provides long-term flexibility without vendor lock-in.

---

# Package Manager

## pnpm

Purpose

Dependency management.

Why?

- Faster installs
- Efficient storage
- Excellent monorepo support

Alternatives

- npm
- yarn

Decision

pnpm is the preferred package manager.

---

# Version Control

## Git

Purpose

Track source code.

Repository Hosting

GitHub

Branch Strategy

- main
- develop
- feature/*

---

# API Style

Phase 1

REST API

Future

GraphQL

Decision

REST provides a simpler implementation for the MVP.

---

# File Storage

Development

Local Storage

Production

Cloudflare R2

Alternative

AWS S3

---

# Payments

Phase 1

- M-Pesa
- Pesapal

Future

- Stripe

---

# Notifications

Phase 1

Email

Future

- SMS
- Push Notifications
- WhatsApp

---

# Deployment

Frontend

Vercel

Backend

Docker

Database

PostgreSQL

---

# Development Tools

IDE

Visual Studio Code

API Testing

Postman

Database Client

TablePlus

Containerization

Docker Desktop

---

# AI Development Tools

Primary Architecture

ChatGPT

Code Assistance

VS Code AI Extensions

Official Framework Documentation

MCP Servers

Purpose

Framework-specific implementation guidance.

Examples

- Strapi
- Next.js
- Tailwind CSS
- Better Auth

Project-specific decisions remain documented inside this repository.

---

# Guiding Principle

Technology should solve business problems.

OnlineDoc does not adopt technologies because they are new.

Every technology must improve maintainability, scalability, security, or developer productivity.

If a technology no longer provides value, it should be replaced through a documented architectural decision.
