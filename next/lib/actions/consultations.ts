"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { consultations, consultationStatusHistory, consultationNotes, consultationFiles, notifications } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

const CONSULTATION_FEE = process.env.CONSULTATION_FEE || "50";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session;
}

function createNotification(userId: string, type: string, title: string, body: string, link: string) {
  return db.insert(notifications).values({
    id: crypto.randomUUID(),
    userId, type, title, body, link,
    createdAt: new Date(),
  });
}

export async function createConsultation(data: {
  consultationType: string;
  title: string;
  symptoms?: string;
  durationOfIllness?: string;
  medicalHistory?: string;
}) {
  const session = await getSession();
  const id = crypto.randomUUID();

  await db.insert(consultations).values({
    id,
    patientId: session.user.id,
    consultationType: data.consultationType,
    title: data.title,
    symptoms: data.symptoms || null,
    durationOfIllness: data.durationOfIllness || null,
    medicalHistory: data.medicalHistory || null,
    status: "draft",
    fee: CONSULTATION_FEE,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(consultationStatusHistory).values({
    id: crypto.randomUUID(),
    consultationId: id,
    status: "draft",
    changedBy: session.user.id,
    createdAt: new Date(),
  });

  return { success: true, consultationId: id };
}

export async function getConsultation(id: string) {
  const session = await getSession();
  const rows = await db
    .select()
    .from(consultations)
    .where(eq(consultations.id, id))
    .limit(1);

  if (rows.length === 0) throw new Error("Consultation not found");

  const consultation = rows[0];
  if (consultation.patientId !== session.user.id && consultation.clinicianId !== session.user.id) {
    throw new Error("Access denied");
  }

  const statusHistory = await db
    .select()
    .from(consultationStatusHistory)
    .where(eq(consultationStatusHistory.consultationId, id))
    .orderBy(desc(consultationStatusHistory.createdAt));

  const notesRows = await db
    .select()
    .from(consultationNotes)
    .where(eq(consultationNotes.consultationId, id))
    .orderBy(desc(consultationNotes.createdAt));

  const files = await db
    .select()
    .from(consultationFiles)
    .where(eq(consultationFiles.consultationId, id))
    .orderBy(desc(consultationFiles.createdAt));

  return { consultation, statusHistory, notes: notesRows, files };
}

export async function listConsultations(role: "patient" | "clinician") {
  const session = await getSession();
  const column = role === "patient" ? consultations.patientId : consultations.clinicianId;

  const rows = await db
    .select()
    .from(consultations)
    .where(eq(column, session.user.id))
    .orderBy(desc(consultations.createdAt));

  return rows;
}

export async function updateConsultationStatus(consultationId: string, newStatus: string) {
  const session = await getSession();

  const validTransitions: Record<string, string[]> = {
    draft: ["awaiting_payment"],
    awaiting_payment: ["paid", "draft"],
    paid: ["waiting_for_clinician"],
    waiting_for_clinician: ["in_consultation"],
    in_consultation: ["completed", "follow_up_required"],
    completed: ["closed", "follow_up_required"],
    follow_up_required: ["in_consultation", "closed"],
    closed: [],
  };

  const existing = await db.select().from(consultations).where(eq(consultations.id, consultationId)).limit(1);
  if (existing.length === 0) throw new Error("Consultation not found");

  const currentStatus = existing[0].status;
  const allowed = validTransitions[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
  }

  const updates: Record<string, any> = { status: newStatus, updatedAt: new Date() };

  if (newStatus === "paid") updates.paidAt = new Date();
  if (newStatus === "completed") updates.completedAt = new Date();

  if (newStatus === "waiting_for_clinician" && !existing[0].clinicianId) {
    updates.clinicianId = session.user.id;
  }

  await db.update(consultations).set(updates).where(eq(consultations.id, consultationId));

  await db.insert(consultationStatusHistory).values({
    id: crypto.randomUUID(),
    consultationId,
    status: newStatus,
    changedBy: session.user.id,
    createdAt: new Date(),
  });

  if (newStatus === "paid") {
    await createNotification(
      existing[0].patientId, "payment_received",
      "Payment Received", "Your consultation payment has been confirmed.",
      `/dashboard/patient/consultations/${consultationId}`
    );
  }

  if (newStatus === "waiting_for_clinician" && existing[0].clinicianId) {
    await createNotification(
      existing[0].clinicianId, "consultation_assigned",
      "New Consultation", "A new consultation has been assigned to you.",
      `/dashboard/clinician/consultations/${consultationId}`
    );
  }

  if (newStatus === "completed") {
    await createNotification(
      existing[0].patientId, "consultation_completed",
      "Consultation Completed", "Your consultation has been completed. View the notes.",
      `/dashboard/patient/consultations/${consultationId}`
    );
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function addConsultationNotes(consultationId: string, data: {
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  advice?: string;
  followUpDate?: string;
}) {
  const session = await getSession();

  const existing = await db.select().from(consultationNotes).where(
    and(
      eq(consultationNotes.consultationId, consultationId),
      eq(consultationNotes.clinicianId, session.user.id)
    )
  ).limit(1);

  if (existing.length > 0) {
    await db.update(consultationNotes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(consultationNotes.id, existing[0].id));
  } else {
    await db.insert(consultationNotes).values({
      id: crypto.randomUUID(),
      consultationId,
      clinicianId: session.user.id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  revalidatePath(`/dashboard/clinician/consultations/${consultationId}`);
  return { success: true };
}

export async function completeConsultation(consultationId: string, notes: {
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  advice?: string;
  followUpDate?: string;
}) {
  await addConsultationNotes(consultationId, notes);
  return updateConsultationStatus(consultationId, "completed");
}

export async function getCommunicationLink(consultationId: string) {
  const session = await getSession();
  const rows = await db.select().from(consultations).where(eq(consultations.id, consultationId)).limit(1);
  if (rows.length === 0) throw new Error("Consultation not found");

  const c = rows[0];
  const patientName = session.user.role === "patient" ? "Patient" : "A patient";

  const message = encodeURIComponent(
    `Hello Dr. ${session.user.role === "clinician" ? "Clinician" : ""},\n\n` +
    `Consultation ID: ${consultationId}\n` +
    `Patient: ${patientName}\n` +
    `Consultation Type: ${c.consultationType}\n` +
    `Chief Complaint: ${c.title}\n` +
    `Payment Status: ${c.status === "paid" || c.status === "waiting_for_clinician" || c.status === "in_consultation" || c.status === "completed" ? "Paid" : "Pending"}\n\n` +
    `Thank you.`
  );

  // WhatsApp link — replace with future adapter
  const whatsappUrl = `https://wa.me/?text=${message}`;

  await db.update(consultations)
    .set({ communicationLink: whatsappUrl, updatedAt: new Date() })
    .where(eq(consultations.id, consultationId));

  return { type: "whatsapp" as const, url: whatsappUrl };
}
