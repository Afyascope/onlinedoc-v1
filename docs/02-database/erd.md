# Entity Relationship Diagram (ERD)

## Purpose

This document defines the relationships between the core entities in the OnlineDoc database.

Detailed descriptions of each entity are documented in the Domain Model.

This document focuses only on relationships.

---

# Phase 1 ERD

                    User
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
    Patient Profile       Clinician Profile
          │                       │
          └───────────┬───────────┘
                      │
                      ▼
               Consultation
                      │
               1 Consultation
                      │
                      ▼
                Conversation
                      │
              1 Conversation
                      │
                     Many
                      ▼
                  Messages

Patient
    │                                            
    │                                            
    ▼                                       
  Orders                                        
    │                                           
    ├──────────────┐                             
    │              │                              ▼              ▼                             
Payment     Digital Product                      
                             
Digital Product                                 
        │                                        
        ▼                                        
    Category                                     
                                                
---

# Catalogue and Clinical Snapshot ERD

```
User (imported_by / approved_by / activated_by)
  │
  ▼
Catalogue Release (one per import, one active per domain)
  │
  └── Catalogue Resource (stable identifier within a release)
          │
          └── Catalogue Resource History

Consultation
  ├── Consultation Notes (history_notes, advice, follow-up)
  ├── Consultation Diagnoses ──snapshot──> Catalogue Resource + Release
  ├── Consultation Requests  ──snapshot──> Catalogue Resource + Release
  ├── Prescriptions          ──snapshot──> Catalogue Resource + Release
  └── Consultation Documents (generation metadata)
```

The snapshot arrows are logical references to the selected resource and release.
Snapshot tables also copy the clinical values (name, code, category, source,
source identifier, and release version) so later catalogue revisions do not
change completed consultations.

---

# Relationship Summary

User                                              
    ├── One Patient Profile                      
    └── One Clinician Profile                     

Patient                                          
    ├── Many Consultations                        
    └── Many Orders                               

Clinician                                        
    └── Many Consultations                       

Consultation
    ├── One Conversation
    ├── One Patient
    ├── One Clinician
    ├── Zero or One Note
    ├── Many Diagnoses (snapshotted)
    ├── Many Laboratory/Radiology Requests (snapshotted)
    ├── Many Prescriptions (snapshotted)
    └── Many Generated Document Records

Conversation
    └── Many Messages

Catalogue Release
    ├── Belongs to one Domain
    ├── Many Catalogue Resources
    └── Many Resource History entries

Catalogue Resource
    ├── Belongs to one Release
    ├── Referenced by consultation snapshots
    └── Many Resource History entries

Order                                            
    ├── One Payment                              
    └── One or More Digital Products              

Digital Product                                 
    └── One Category                            

---

# Related Documents

- database-overview.md
- ../04-features/clinical-catalogue.md
