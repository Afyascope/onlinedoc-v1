# Chat

## Purpose

The Chat feature enables secure communication between patients and clinicians during a consultation.

---

## Objectives

- Exchange messages.
- Share files.
- Maintain conversation history.
- Improve communication.

---

## Actors

- Patient
- Clinician

---

## User Stories

### Patient

As a patient, I want to:

- Send messages.
- Receive replies.
- Upload images.
- View previous messages.

### Clinician

As a clinician, I want to:

- Respond to patients.
- Review conversation history.
- Share guidance.

---

## Workflow

Consultation Starts

↓

Conversation Created

↓

Patient Sends Message

↓

Clinician Responds

↓

Conversation Continues

↓

Consultation Completed

---

## Business Rules

- Chat exists only inside a consultation.
- Only participants can access a conversation.
- Messages are stored permanently.
- Attachments are linked to messages.

---

## Screens

- Conversation List
- Chat Window
- Message Attachments

---

## Related APIs

- Conversations
- Messages

---

## Related Database Entities

- Conversation
- Message
- Consultation

---

## Future Improvements

- Voice Notes
- Typing Indicators
- Read Receipts
- Message Search