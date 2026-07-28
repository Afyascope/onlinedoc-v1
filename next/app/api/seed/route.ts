import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, appointments, medicalRecords, prescriptions, payments, consultations, clinicianProfiles, settings, consultationStatusHistory, consultationNotes, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";

function uid() { return crypto.randomUUID(); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; }
function daysFromNow(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; }

const SEED_USERS = [
  { name: "Admin User", email: "admin@onlinedoc.com", password: "Admin@123", role: "admin" as const, clinicianApproved: true },
  { name: "Dr. Sarah Smith", email: "clinician@onlinedoc.com", password: "Clinician@123", role: "clinician" as const, clinicianApproved: true },
  { name: "Dr. James Wilson", email: "wilson@onlinedoc.com", password: "Wilson@123", role: "clinician" as const, clinicianApproved: true },
  { name: "John Doe", email: "patient@onlinedoc.com", password: "Patient@123", role: "patient" as const, clinicianApproved: false },
  { name: "Emily Johnson", email: "emily@onlinedoc.com", password: "Emily@123", role: "patient" as const, clinicianApproved: false },
  { name: "Michael Brown", email: "michael@onlinedoc.com", password: "Michael@123", role: "patient" as const, clinicianApproved: false },
];

export async function POST() {
  const results: { email: string; role: string; status: string }[] = [];
  const userIds: Record<string, string> = {};

  for (const u of SEED_USERS) {
    try {
      const existing = await db.select().from(user).where(eq(user.email, u.email)).limit(1);
      if (existing.length > 0) {
        userIds[u.email] = existing[0].id;
        await db.update(user).set({ emailVerified: true, clinicianApproved: u.clinicianApproved, updatedAt: new Date() }).where(eq(user.id, existing[0].id));
        results.push({ email: u.email, role: u.role, status: "already exists" });
        continue;
      }

      const headers = new Headers({ "Content-Type": "application/json" });
      const signUpRes = await auth.api.signUpEmail({
        body: { name: u.name, email: u.email, password: u.password },
        headers,
      });

      const createdUserId = signUpRes.data?.user?.id;
      if (!createdUserId) {
        results.push({ email: u.email, role: u.role, status: `signup failed: ${JSON.stringify(signUpRes.error || signUpRes)}` });
        continue;
      }

      userIds[u.email] = createdUserId;

      await db.update(user).set({
        role: u.role,
        emailVerified: true,
        clinicianApproved: u.clinicianApproved,
        updatedAt: new Date(),
      }).where(eq(user.id, createdUserId));

      results.push({ email: u.email, role: u.role, status: "created" });
    } catch (e: any) {
      results.push({ email: u.email, role: u.role, status: `exception: ${e?.message || e}` });
    }
  }

  const adminId = userIds["admin@onlinedoc.com"];
  const sarahId = userIds["clinician@onlinedoc.com"];
  const wilsonId = userIds["wilson@onlinedoc.com"];
  const johnId = userIds["patient@onlinedoc.com"];
  const emilyId = userIds["emily@onlinedoc.com"];
  const michaelId = userIds["michael@onlinedoc.com"];

  if (sarahId && wilsonId && johnId && emilyId && michaelId) {
    const now = new Date();

    if (sarahId) {
      const existingProfile = await db.select().from(clinicianProfiles).where(eq(clinicianProfiles.userId, sarahId)).limit(1);
      if (existingProfile.length === 0) {
        await db.insert(clinicianProfiles).values({ userId: sarahId, specialization: "Cardiology", qualifications: "MD, FACC", bio: "Board-certified cardiologist with 15+ years.", yearsOfExperience: 15, consultationFee: "200", currency: "USD", isAcceptingPatients: true, createdAt: now, updatedAt: now });
      }
    }
    if (wilsonId) {
      const existingProfile = await db.select().from(clinicianProfiles).where(eq(clinicianProfiles.userId, wilsonId)).limit(1);
      if (existingProfile.length === 0) {
        await db.insert(clinicianProfiles).values({ userId: wilsonId, specialization: "Pediatrics", qualifications: "MD, FAAP", bio: "Dedicated pediatrician with 10+ years.", yearsOfExperience: 10, consultationFee: "150", currency: "USD", isAcceptingPatients: true, createdAt: now, updatedAt: now });
      }
    }

    const existingAppts = await db.select().from(appointments).limit(1);
    if (existingAppts.length === 0) {
      await db.insert(appointments).values([
        { id: uid(), patientId: johnId, clinicianId: sarahId, title: "Annual Cardiac Checkup", date: daysFromNow(2), time: "09:00", duration: 30, type: "in_person", status: "scheduled", createdAt: now, updatedAt: now },
        { id: uid(), patientId: emilyId, clinicianId: sarahId, title: "Follow-up Consultation", date: daysFromNow(5), time: "14:30", duration: 20, type: "video", status: "confirmed", createdAt: now, updatedAt: now },
        { id: uid(), patientId: michaelId, clinicianId: wilsonId, title: "Child Wellness Visit", date: daysFromNow(3), time: "10:00", duration: 30, type: "in_person", status: "scheduled", createdAt: now, updatedAt: now },
        { id: uid(), patientId: johnId, clinicianId: sarahId, title: "Blood Work Results", date: daysAgo(7), time: "11:00", duration: 15, type: "in_person", status: "completed", createdAt: now, updatedAt: now },
        { id: uid(), patientId: emilyId, clinicianId: wilsonId, title: "Annual Physical", date: daysAgo(14), time: "09:30", duration: 45, type: "in_person", status: "completed", createdAt: now, updatedAt: now },
      ]);
    }

    const existingRecords = await db.select().from(medicalRecords).limit(1);
    if (existingRecords.length === 0) {
      await db.insert(medicalRecords).values([
        { id: uid(), patientId: johnId, clinicianId: sarahId, type: "lab", title: "Complete Blood Count", description: "All values within normal range.", recordDate: daysAgo(7), createdAt: now, updatedAt: now },
        { id: uid(), patientId: johnId, clinicianId: sarahId, type: "diagnosis", title: "Hypertension Stage 1", description: "Blood pressure slightly elevated.", recordDate: daysAgo(30), createdAt: now, updatedAt: now },
        { id: uid(), patientId: emilyId, clinicianId: wilsonId, type: "visit", title: "General Checkup", description: "Patient in good health.", recordDate: daysAgo(14), createdAt: now, updatedAt: now },
        { id: uid(), patientId: michaelId, clinicianId: wilsonId, type: "visit", title: "Vaccination Record", description: "Routine vaccinations administered.", recordDate: daysAgo(3), createdAt: now, updatedAt: now },
      ]);
    }

    const existingRx = await db.select().from(prescriptions).limit(1);
    if (existingRx.length === 0) {
      await db.insert(prescriptions).values([
        { id: uid(), patientId: johnId, clinicianId: sarahId, medication: "Lisinopril", dosage: "10mg", frequency: "Once daily", instructions: "Take in the morning with food", startDate: daysAgo(30), endDate: daysFromNow(335), status: "active", refillsRemaining: 3, refillsTotal: 3, createdAt: now, updatedAt: now },
        { id: uid(), patientId: johnId, clinicianId: sarahId, medication: "Atorvastatin", dosage: "20mg", frequency: "Once daily at bedtime", startDate: daysAgo(30), endDate: daysFromNow(335), status: "active", refillsRemaining: 2, refillsTotal: 3, createdAt: now, updatedAt: now },
        { id: uid(), patientId: michaelId, clinicianId: wilsonId, medication: "Amoxicillin", dosage: "250mg", frequency: "Three times daily", startDate: daysAgo(10), endDate: daysAgo(3), status: "completed", refillsRemaining: 0, refillsTotal: 0, createdAt: now, updatedAt: now },
      ]);
    }

    const existingPayments = await db.select().from(payments).limit(1);
    if (existingPayments.length === 0) {
      await db.insert(payments).values([
        { id: uid(), patientId: johnId, amount: "200", currency: "USD", status: "completed", method: "card", description: "Cardiology Consultation", invoiceNumber: "INV-2024-001", dueDate: daysAgo(30), paidAt: new Date(Date.now() - 20 * 86400000), createdAt: now, updatedAt: now },
        { id: uid(), patientId: johnId, amount: "150", currency: "USD", status: "pending", description: "Follow-up Visit", invoiceNumber: "INV-2024-002", dueDate: daysFromNow(15), createdAt: now, updatedAt: now },
        { id: uid(), patientId: emilyId, amount: "150", currency: "USD", status: "completed", method: "card", description: "Annual Physical", invoiceNumber: "INV-2024-003", dueDate: daysAgo(14), paidAt: new Date(Date.now() - 10 * 86400000), createdAt: now, updatedAt: now },
      ]);
    }

    const existingConsults = await db.select().from(consultations).limit(1);
    if (existingConsults.length === 0) {
      const consult1Id = uid();
      const consult2Id = uid();
      const consult3Id = uid();
      const consult4Id = uid();
      const consult5Id = uid();
      await db.insert(consultations).values([
        { id: consult1Id, patientId: johnId, clinicianId: sarahId, title: "Chest Pain Evaluation", description: "Experiencing mild chest pain after exercise", status: "in_consultation", fee: "50", urgency: "medium", specialty: "Cardiology", createdAt: new Date(Date.now() - 3 * 86400000), updatedAt: now },
        { id: consult2Id, patientId: emilyId, clinicianId: sarahId, title: "Headache Follow-up", description: "Persistent migraines for the past week", status: "paid", fee: "50", urgency: "low", specialty: "Neurology", createdAt: new Date(Date.now() - 1 * 86400000), updatedAt: now },
        { id: consult3Id, patientId: michaelId, clinicianId: wilsonId, title: "Child Fever Consultation", description: "My 3-year-old has had a fever for 2 days", status: "waiting_for_clinician", fee: "50", urgency: "high", specialty: "Pediatrics", createdAt: new Date(Date.now() - 2 * 86400000), updatedAt: now },
        { id: consult4Id, patientId: johnId, clinicianId: sarahId, title: "Blood Pressure Review", description: "Need to review blood pressure medication", status: "completed", fee: "50", urgency: "low", specialty: "Cardiology", clinicianNotes: "Blood pressure is stable. Continue current medication.", diagnosis: "Essential hypertension, controlled", treatmentPlan: "Continue Lisinopril 10mg daily. Follow up in 3 months.", completedAt: new Date(Date.now() - 14 * 86400000), createdAt: new Date(Date.now() - 21 * 86400000), updatedAt: new Date(Date.now() - 14 * 86400000) },
        { id: consult5Id, patientId: emilyId, clinicianId: sarahId, title: "General Health Inquiry", description: "Feeling fatigued and low energy", status: "draft", fee: "50", urgency: "low", specialty: "General", createdAt: now, updatedAt: now },
      ]);

      await db.insert(consultationStatusHistory).values([
        { id: uid(), consultationId: consult1Id, fromStatus: "awaiting_payment", toStatus: "paid", changedBy: "system", createdAt: new Date(Date.now() - 3 * 86400000 + 60000) },
        { id: uid(), consultationId: consult1Id, fromStatus: "paid", toStatus: "waiting_for_clinician", changedBy: "system", createdAt: new Date(Date.now() - 3 * 86400000 + 120000) },
        { id: uid(), consultationId: consult1Id, fromStatus: "waiting_for_clinician", toStatus: "in_consultation", changedBy: sarahId, createdAt: new Date(Date.now() - 3 * 86400000 + 180000) },
        { id: uid(), consultationId: consult2Id, fromStatus: "awaiting_payment", toStatus: "paid", changedBy: "system", createdAt: new Date(Date.now() - 1 * 86400000 + 60000) },
        { id: uid(), consultationId: consult3Id, fromStatus: "awaiting_payment", toStatus: "paid", changedBy: "system", createdAt: new Date(Date.now() - 2 * 86400000 + 60000) },
        { id: uid(), consultationId: consult3Id, fromStatus: "paid", toStatus: "waiting_for_clinician", changedBy: "system", createdAt: new Date(Date.now() - 2 * 86400000 + 120000) },
        { id: uid(), consultationId: consult4Id, fromStatus: "draft", toStatus: "awaiting_payment", changedBy: "system", createdAt: new Date(Date.now() - 21 * 86400000 + 30000) },
        { id: uid(), consultationId: consult4Id, fromStatus: "awaiting_payment", toStatus: "paid", changedBy: "system", createdAt: new Date(Date.now() - 21 * 86400000 + 60000) },
        { id: uid(), consultationId: consult4Id, fromStatus: "paid", toStatus: "waiting_for_clinician", changedBy: "system", createdAt: new Date(Date.now() - 21 * 86400000 + 120000) },
        { id: uid(), consultationId: consult4Id, fromStatus: "waiting_for_clinician", toStatus: "in_consultation", changedBy: sarahId, createdAt: new Date(Date.now() - 21 * 86400000 + 180000) },
        { id: uid(), consultationId: consult4Id, fromStatus: "in_consultation", toStatus: "completed", changedBy: sarahId, createdAt: new Date(Date.now() - 14 * 86400000) },
      ]);

      await db.insert(consultationNotes).values([
        { id: uid(), consultationId: consult1Id, authorId: sarahId, content: "Patient reports mild chest pain during exercise. EKG normal. Recommended stress test.", isPrivate: false, createdAt: new Date(Date.now() - 3 * 86400000 + 3600000), updatedAt: new Date(Date.now() - 3 * 86400000 + 3600000) },
        { id: uid(), consultationId: consult1Id, authorId: johnId, content: "The chest pain usually lasts about 5 minutes and goes away with rest.", isPrivate: false, createdAt: new Date(Date.now() - 3 * 86400000 + 7200000), updatedAt: new Date(Date.now() - 3 * 86400000 + 7200000) },
        { id: uid(), consultationId: consult4Id, authorId: sarahId, content: "Blood pressure reading today: 128/82. Improved from last visit.", isPrivate: false, createdAt: new Date(Date.now() - 14 * 86400000 + 3600000), updatedAt: new Date(Date.now() - 14 * 86400000 + 3600000) },
      ]);

      await db.insert(notifications).values([
        { id: uid(), userId: johnId, type: "consultation_update", title: "Consultation is active", body: "Dr. Sarah Smith has started your consultation on Chest Pain Evaluation.", link: "/dashboard/patient/consultations/" + consult1Id, createdAt: new Date(Date.now() - 3 * 86400000 + 180000) },
        { id: uid(), userId: johnId, type: "consultation_complete", title: "Consultation completed", body: "Your Blood Pressure Review consultation has been completed. View the summary.", link: "/dashboard/patient/consultations/" + consult4Id, createdAt: new Date(Date.now() - 14 * 86400000) },
        { id: uid(), userId: emilyId, type: "payment_required", title: "Payment confirmed", body: "Your payment for Headache Follow-up has been received.", link: "/dashboard/patient/consultations/" + consult2Id, createdAt: new Date(Date.now() - 1 * 86400000 + 60000) },
        { id: uid(), userId: michaelId, type: "consultation_update", title: "Consultation awaiting clinician", body: "Your Child Fever Consultation has been paid and is waiting for a clinician.", link: "/dashboard/patient/consultations/" + consult3Id, createdAt: new Date(Date.now() - 2 * 86400000 + 120000) },
        { id: uid(), userId: sarahId, type: "new_consultation", title: "New consultation assigned", body: "John Doe's Chest Pain Evaluation has been assigned to you.", link: "/dashboard/clinician/consultations/" + consult1Id, createdAt: new Date(Date.now() - 3 * 86400000 + 120000) },
        { id: uid(), userId: sarahId, type: "new_consultation", title: "New consultation available", body: "Emily Johnson's Headache Follow-up is ready for you.", link: "/dashboard/clinician/consultations/" + consult2Id, createdAt: new Date(Date.now() - 1 * 86400000 + 60000) },
        { id: uid(), userId: wilsonId, type: "new_consultation", title: "New consultation available", body: "Michael Brown's Child Fever Consultation is waiting for attention.", link: "/dashboard/clinician/consultations/" + consult3Id, createdAt: new Date(Date.now() - 2 * 86400000 + 120000) },
      ]);
    }

    const existingSettings = await db.select().from(settings).limit(1);
    if (existingSettings.length === 0) {
      await db.insert(settings).values([
        { id: uid(), key: "max_appointments_per_day", value: "8", type: "number", description: "Maximum appointments per day per clinician", updatedAt: now },
        { id: uid(), key: "require_approval", value: "true", type: "boolean", description: "Require admin approval for new clinicians", updatedAt: now },
        { id: uid(), key: "consultation_duration", value: "30", type: "number", description: "Default consultation duration in minutes", updatedAt: now },
      ]);
    }
  }

  return NextResponse.json({ message: "Seed complete", results });
}
