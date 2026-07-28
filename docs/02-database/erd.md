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
    └── One Patient                             
    └── One Clinician                            

Conversation                                     
    └── Many Messages                            

Order                                            
    ├── One Payment                              
    └── One or More Digital Products              

Digital Product                                 
    └── One Category                            
