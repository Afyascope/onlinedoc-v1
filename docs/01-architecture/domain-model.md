# Domain Model

## Purpose

This document defines the core business entities of OnlineDoc.

A domain model represents the language of the business rather than the implementation.

It answers one fundamental question:

"What are the important things that exist in OnlineDoc?"

Every database table, Strapi content type, API endpoint, frontend component, and business process must originate from this document.

---

# Domain Overview

OnlineDoc is a digital healthcare platform connecting patients with licensed clinicians through secure online healthcare services.

The platform revolves around one central concept:

A Consultation.

Everything else either supports, extends, or results from a consultation.

---

# Core Domain

Patient                                          
    │
    │ starts                                     
    ▼
Consultation                                     
    │                                            
    ├── Conversation                             
    ├── Messages                                  
    ├── Payment                                  
    ├── Notes                                    
    ├── Prescription (Future)                     
    ├── Laboratory Request (Future)              
    ├── Referral (Future)                        
    └── Medical Certificate (Future)             

---

# Core Entities

## Patient

Description

A patient is a registered user seeking healthcare services.

Responsibilities

- Register an account
- Purchase consultations
- Communicate with clinicians
- Purchase digital products
- Manage personal information
- Access consultation history

Owns

- Consultations
- Orders
- Payments
- Digital Library

---

## Clinician

Description

A licensed healthcare professional providing medical consultations.

Responsibilities

- Accept consultations
- Review patient information
- Communicate with patients
- Complete consultations
- Maintain professional profile

Owns

- Availability
- Consultation Notes
- Consultation History

---

## Consultation

Description

The consultation is the central business entity within OnlineDoc.

Every healthcare interaction occurs inside a consultation.

Types

- Chat Consultation
- Follow-up Consultation
- Urgent Consultation
- Audio Consultation (Future)
- Video Consultation (Future)

Status

- Pending
- Accepted
- Active
- Completed
- Cancelled

Relationships

Belongs to

- Patient
- Clinician

Contains

- Conversation
- Messages
- Payment
- Notes

Future

- Prescription
- Referral
- Laboratory Request
- Medical Certificate

---

## Conversation

Description

A conversation is the communication channel for a consultation.

Each consultation owns exactly one conversation.

Contains

- Messages

---

## Message

Description

A message represents a single communication event.

Types

- Text
- Image
- File
- Voice Note (Future)

Status

- Sent
- Delivered
- Read

Belongs to

- Conversation

Created By

- Patient
- Clinician

---

## Digital Product

Description

A digital healthcare resource available for purchase.

Examples

- Diabetes Meal Plan
- Hypertension Guide
- Pregnancy Nutrition Guide
- Gastritis Diet Guide
- Exercise Plan
- Patient Education Guide

Attributes

- Title
- Description
- Price
- Category
- Cover Image
- PDF
- Status

---

## Category

Description

Organizes digital products.

Examples

- Nutrition
- Diabetes
- Pregnancy
- Exercise
- Child Health
- Hypertension
- Mental Wellness

---

## Order

Description

Represents a purchase made by a patient.

Examples

- Consultation Purchase
- Digital Product Purchase

Status

- Pending
- Paid
- Cancelled
- Refunded

---

## Payment

Description

Represents a financial transaction.

Methods

- M-Pesa
- Pesapal

Status

- Pending
- Successful
- Failed
- Refunded

---

## Notification

Description

Represents information delivered to a user.

Examples

- Consultation Accepted
- Payment Successful
- New Message
- Order Completed

Channels

- Email
- In-app

Future

- SMS
- Push Notification
- WhatsApp

---

# Supporting Entities

## User

Represents an authenticated account.

Roles

- Patient
- Clinician
- Administrator

---

## Profile

Stores user information.

Patient Profile

- Name
- Date of Birth
- Gender
- Contact Information

Clinician Profile

- Qualifications
- Registration Number
- Specialization
- Biography
- Experience

---

## Settings

Stores configurable platform values.

Examples

- Consultation Prices
- Platform Configuration
- Contact Information
- Payment Settings

---

# Future Entities

These entities are intentionally excluded from Phase 1.

- Prescription
- Laboratory Request
- Referral
- Medical Certificate
- Appointment
- Pharmacy Order
- Insurance Claim
- Electronic Medical Record
- Video Session
- Audio Session
- AI Consultation

The architecture must allow these entities to be added without redesigning the system.

---

# Domain Principles

The Consultation is the center of the platform.

Patients do not chat directly with clinicians.

Patients communicate through Consultations.

Messages never exist outside Conversations.

Conversations never exist outside Consultations.

Payments belong to Orders.

Orders belong to Patients.

Digital Products are purchased through Orders.

Business rules must reflect these relationships.

---

# Ubiquitous Language

The following terms must be used consistently throughout the project.

Patient

Clinician

Consultation

Conversation

Message

Digital Product

Category

Order

Payment

Notification

Profile

Avoid introducing new terminology for existing concepts.

Consistency across documentation, APIs, database schemas, and user interfaces reduces complexity and improves maintainability.
