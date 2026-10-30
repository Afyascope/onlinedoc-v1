"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { consultations, consultationStatusHistory, consultationNotes, consultationFiles, notifications, user, platformSettings, consultationDiagnoses, consultationRequests, prescriptions } from "@/db/schema";
import { eq, desc, and, isNull, isNotNull } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { appUrl, sendEmail } from "@/lib/email/send";
import { getClinicianStatus } from "@/lib/clinician-status";
import { consultationFee } from "@/lib/config";
import { loadSelectableResources } from "@/lib/catalogue/service";
import { parseNewPrescriptionFrequency } from "@/lib/prescriptions/frequency";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (session.user.role === "clinician" && getClinicianStatus(session.user) !== "APPROVED") throw new Error("Clinician approval required");
  return session;
}

function patientConsultationSummary(consultation: typeof consultations.$inferSelect) {
  return {
    id: consultation.id,
    title: consultation.title,
    consultationType: consultation.consultationType,
    status: consultation.status,
    fee: consultation.fee,
    completedAt: consultation.completedAt,
    followUpDate: consultation.followUpDate,
    createdAt: consultation.createdAt,
    clinicianId: consultation.clinicianId,
  };
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
  const [feeSetting] = await db
    .select({ value: platformSettings.value })
    .from(platformSettings)
    .where(eq(platformSettings.key, "consultation_fee"))
    .limit(1);
  const fee = consultationFee(feeSetting?.value);

  await db.transaction(async (tx) => {
    await tx.insert(consultations).values({
      id,
      patientId: session.user.id,
      consultationType: data.consultationType,
      title: data.title,
      symptoms: data.symptoms || null,
      durationOfIllness: data.durationOfIllness || null,
      medicalHistory: data.medicalHistory || null,
      status: "draft",
      fee,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await tx.insert(consultationStatusHistory).values({
      id: crypto.randomUUID(),
      consultationId: id,
      status: "draft",
      changedBy: session.user.id,
      createdAt: new Date(),
    });
  });

  revalidatePath("/dashboard/patient/consultations");
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

  // Clinical notes are clinician-only. Patient responses must never serialize
  // history notes, internal summaries or clinician comments.
  const canViewClinicalNotes =
    session.user.role === "clinician" && consultation.clinicianId === session.user.id;
  const notesRows = canViewClinicalNotes
    ? await db
        .select()
        .from(consultationNotes)
        .where(eq(consultationNotes.consultationId, id))
        .orderBy(desc(consultationNotes.createdAt))
    : [];

  const files = await db
    .select()
    .from(consultationFiles)
    .where(eq(consultationFiles.consultationId, id))
    .orderBy(desc(consultationFiles.createdAt));

  return {
    consultation: canViewClinicalNotes ? consultation : patientConsultationSummary(consultation),
    statusHistory,
    notes: notesRows,
    files,
  };
}

export async function listConsultations(role: "patient" | "clinician") {
  const session = await getSession();
  const column = role === "patient" ? consultations.patientId : consultations.clinicianId;

  if (role === "patient") {
    return db
      .select({
        id: consultations.id,
        title: consultations.title,
        consultationType: consultations.consultationType,
        status: consultations.status,
        fee: consultations.fee,
        completedAt: consultations.completedAt,
        followUpDate: consultations.followUpDate,
        createdAt: consultations.createdAt,
        clinicianId: consultations.clinicianId,
      })
      .from(consultations)
      .where(eq(column, session.user.id))
      .orderBy(desc(consultations.createdAt));
  }

  return db
    .select()
    .from(consultations)
    .where(eq(column, session.user.id))
    .orderBy(desc(consultations.createdAt));
}

export async function claimConsultation(consultationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { success: false as const, error: "Not authenticated" };
  if (session.user.role !== "clinician") return { success: false as const, error: "Clinician access required" };
  if (getClinicianStatus(session.user) !== "APPROVED") {
    return { success: false as const, error: "Your clinician account is not approved for consultations." };
  }

  let approvedClinicians: { id: string }[];
  try {
    approvedClinicians = await db.select({ id: user.id })
      .from(user)
      .where(and(
        eq(user.id, session.user.id),
        eq(user.role, "clinician"),
        eq(user.clinicianStatus, "APPROVED")
      ))
      .limit(1);
  } catch {
    return { success: false as const, error: "Unable to verify clinician eligibility right now." };
  }
  if (approvedClinicians.length === 0) {
    return { success: false as const, error: "Your clinician account is not approved for consultations." };
  }

  try {
    const claimed = await db.transaction(async (tx) => {
      const rows = await tx.update(consultations).set({
        clinicianId: session.user.id,
        status: "waiting_for_clinician",
        updatedAt: new Date(),
      }).where(and(
        eq(consultations.id, consultationId),
        eq(consultations.status, "paid"),
        isNull(consultations.clinicianId),
        isNotNull(consultations.paidAt)
      )).returning({ id: consultations.id });

      if (rows.length === 0) return false;

      await tx.insert(consultationStatusHistory).values({
        id: crypto.randomUUID(),
        consultationId,
        status: "waiting_for_clinician",
        changedBy: session.user.id,
        createdAt: new Date(),
      });
      await tx.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        type: "consultation_assigned",
        title: "Consultation assigned to you",
        body: "You accepted a paid consultation. It is ready to start.",
        link: `/dashboard/clinician/consultations/${consultationId}`,
        createdAt: new Date(),
      });
      return true;
    });

    if (!claimed) return { success: false as const, error: "This consultation is no longer available." };
  } catch {
    return { success: false as const, error: "Unable to accept this consultation right now." };
  }

  revalidatePath("/dashboard/clinician");
  revalidatePath("/dashboard/clinician/consultations");
  revalidatePath("/dashboard/admin/consultations");
  return { success: true as const };
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
  const consultation = existing[0];

  if (session.user.role === "patient" && consultation.patientId !== session.user.id) {
    throw new Error("Access denied");
  }
  if (session.user.role === "clinician" && consultation.clinicianId !== session.user.id) {
    throw new Error("Access denied");
  }
  if (session.user.role === "patient" && newStatus !== "awaiting_payment") {
    throw new Error("Patients cannot perform this status transition");
  }
  const allowed = validTransitions[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
  }
  if (newStatus === "completed") {
    throw new Error("Complete the consultation through the structured completion form");
  }

  const updates: Record<string, any> = { status: newStatus, updatedAt: new Date() };

  if (newStatus === "paid") updates.paidAt = new Date();
  if (newStatus === "completed") updates.completedAt = new Date();

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
    await sendEmail({ to: session.user.email, subject: "Your consultation is booked", template: "consultation-booked", props: { recipientName: session.user.name, title: existing[0].title, consultationUrl: appUrl(`/dashboard/patient/consultations/${consultationId}`), role: "patient" } });
  }

  if (newStatus === "waiting_for_clinician" && existing[0].clinicianId) {
    await createNotification(
      existing[0].clinicianId, "consultation_assigned",
      "New Consultation", "A new consultation has been assigned to you.",
      `/dashboard/clinician/consultations/${consultationId}`
    );
    const clinicianRows = await db.select().from(user).where(eq(user.id, existing[0].clinicianId)).limit(1);
    const clinician = clinicianRows[0];
    if (clinician) await sendEmail({ to: clinician.email, subject: "New consultation request", template: "consultation-booked", props: { recipientName: clinician.name, title: existing[0].title, consultationUrl: appUrl(`/dashboard/clinician/consultations/${consultationId}`), role: "clinician" } });
  }

  if (newStatus === "completed") {
    await createNotification(
      existing[0].patientId, "consultation_completed",
      "Consultation Completed", "Your consultation has been completed. View the notes.",
      `/dashboard/patient/consultations/${consultationId}`
    );
    await sendEmail({ to: session.user.email, subject: "Your consultation is complete", template: "consultation-booked", props: { recipientName: session.user.name, title: existing[0].title, consultationUrl: appUrl(`/dashboard/patient/consultations/${consultationId}`), role: "patient" } });
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function addConsultationNotes(consultationId: string, data: {
  historyNotes?: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  advice?: string;
  followUpDate?: string;
}) {
  const session = await getSession();

  if (session.user.role !== "clinician") throw new Error("Clinician access required");

  const consultationRows = await db.select().from(consultations).where(eq(consultations.id, consultationId)).limit(1);
  if (consultationRows.length === 0 || consultationRows[0].clinicianId !== session.user.id) {
    throw new Error("Access denied");
  }
  if (consultationRows[0].status === "completed" || consultationRows[0].status === "closed") {
    throw new Error("Completed consultations cannot be edited");
  }

  assertMaxLength(data.historyNotes, "History notes", 10000);
  assertMaxLength(data.diagnosis, "Diagnosis summary", 5000);
  assertMaxLength(data.treatment, "Treatment summary", 5000);
  assertMaxLength(data.prescription, "Prescription summary", 5000);
  assertMaxLength(data.advice, "Advice", 4000);
  if (data.followUpDate && !isValidDateOnly(data.followUpDate)) {
    throw new Error("Follow-up date is invalid");
  }

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

export interface ConsultationDiagnosisInput {
  resourceId: string;
  notes?: string;
}

export interface ConsultationRequestInput {
  resourceId: string;
  notes?: string;
}

export interface ConsultationPrescriptionInput {
  resourceId: string;
  dosage: string;
  dosageForm?: string;
  frequency: string;
  duration?: string;
  route?: string;
  instructions?: string;
}

export interface ConsultationCompletionInput {
  historyNotes?: string;
  diagnosis?: string;
  advice?: string;
  followUpDate?: string;
  diagnoses?: ConsultationDiagnosisInput[];
  laboratoryRequests?: ConsultationRequestInput[];
  radiologyRequests?: ConsultationRequestInput[];
  prescriptions?: ConsultationPrescriptionInput[];
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function uniqueSelections<T extends { resourceId: string }>(items: T[] | undefined, label: string): T[] {
  if (!Array.isArray(items)) return [];
  if (items.length > 50) throw new Error(`Too many ${label} selections`);
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item?.resourceId || seen.has(item.resourceId)) return false;
    seen.add(item.resourceId);
    return true;
  });
}

function assertMaxLength(value: string | undefined | null, label: string, max: number) {
  if (value && value.length > max) throw new Error(`${label} must be ${max} characters or fewer`);
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function completeConsultation(consultationId: string, data: ConsultationCompletionInput) {
  const session = await getSession();
  if (session.user.role !== "clinician") throw new Error("Clinician access required");

  const consultationRows = await db.select().from(consultations).where(eq(consultations.id, consultationId)).limit(1);
  if (consultationRows.length === 0 || consultationRows[0].clinicianId !== session.user.id) {
    throw new Error("Access denied");
  }
  const consultation = consultationRows[0];
  if (consultation.status === "completed" || consultation.status === "closed") {
    throw new Error("Consultation has already been completed");
  }
  if (consultation.status !== "in_consultation") {
    throw new Error("Consultation must be in progress before it can be completed");
  }

  const diagnoses = uniqueSelections(data.diagnoses, "diagnosis");
  const laboratoryRequests = uniqueSelections(data.laboratoryRequests, "laboratory request");
  const radiologyRequests = uniqueSelections(data.radiologyRequests, "radiology request");
  const prescriptionItems = uniqueSelections(data.prescriptions, "prescription");
  assertMaxLength(data.historyNotes, "History notes", 10000);
  assertMaxLength(data.diagnosis, "Diagnosis summary", 5000);
  assertMaxLength(data.advice, "Advice", 4000);
  if (data.followUpDate && !isValidDateOnly(data.followUpDate)) {
    throw new Error("Follow-up date is invalid");
  }
  for (const item of [...diagnoses, ...laboratoryRequests, ...radiologyRequests]) {
    assertMaxLength(item.notes, "Selection notes", 1000);
  }
  for (const item of prescriptionItems) {
    if (!item.dosage?.trim()) throw new Error("Prescription dosage is required");
    if (!item.frequency?.trim()) throw new Error("Prescription frequency is required");
    parseNewPrescriptionFrequency(item.frequency);
    assertMaxLength(item.dosage, "Prescription dosage", 200);
    assertMaxLength(item.dosageForm, "Prescription dosage form", 100);
    assertMaxLength(item.frequency, "Prescription frequency", 200);
    assertMaxLength(item.duration, "Prescription duration", 100);
    assertMaxLength(item.route, "Prescription route", 100);
    assertMaxLength(item.instructions, "Prescription instructions", 2000);
  }

  const [diagnosisMap, laboratoryMap, radiologyMap, medicationMap] = await Promise.all([
    loadSelectableResources("diagnosis", diagnoses.map((item) => item.resourceId)),
    loadSelectableResources("laboratory", laboratoryRequests.map((item) => item.resourceId)),
    loadSelectableResources("radiology", radiologyRequests.map((item) => item.resourceId)),
    loadSelectableResources("medication", prescriptionItems.map((item) => item.resourceId)),
  ]);

  for (const item of diagnoses) {
    if (!diagnosisMap.has(item.resourceId)) throw new Error("A selected diagnosis is no longer active. Refresh and select it again.");
  }
  for (const item of laboratoryRequests) {
    if (!laboratoryMap.has(item.resourceId)) throw new Error("A selected laboratory test is no longer active. Refresh and select it again.");
  }
  for (const item of radiologyRequests) {
    if (!radiologyMap.has(item.resourceId)) throw new Error("A selected radiology service is no longer active. Refresh and select it again.");
  }
  for (const item of prescriptionItems) {
    if (!medicationMap.has(item.resourceId)) throw new Error("A selected medication is no longer active. Refresh and select it again.");
  }

  const now = new Date();
  const diagnosisText = data.diagnosis?.trim() || diagnoses.map((item) => diagnosisMap.get(item.resourceId)?.name).filter(Boolean).join(", ");
  const prescriptionText = prescriptionItems.map((item) => medicationMap.get(item.resourceId)?.name).filter(Boolean).join(", ");
  const followUpDate = data.followUpDate || null;

  await db.transaction(async (tx) => {
    const existing = await tx.select().from(consultationNotes).where(
      and(
        eq(consultationNotes.consultationId, consultationId),
        eq(consultationNotes.clinicianId, session.user.id),
      ),
    ).limit(1);

    const noteValues = {
      historyNotes: data.historyNotes ?? null,
      diagnosis: diagnosisText || null,
      prescription: prescriptionText || null,
      advice: data.advice ?? null,
      followUpDate,
      updatedAt: now,
    };

    if (existing.length > 0) {
      await tx.update(consultationNotes).set(noteValues).where(eq(consultationNotes.id, existing[0].id));
    } else {
      await tx.insert(consultationNotes).values({
        id: crypto.randomUUID(),
        consultationId,
        clinicianId: session.user.id,
        ...noteValues,
        createdAt: now,
      });
    }

    await tx.delete(consultationDiagnoses).where(eq(consultationDiagnoses.consultationId, consultationId));
    await tx.delete(consultationRequests).where(eq(consultationRequests.consultationId, consultationId));
    await tx.delete(prescriptions).where(eq(prescriptions.consultationId, consultationId));

    if (diagnoses.length > 0) {
      await tx.insert(consultationDiagnoses).values(diagnoses.map((item, index) => {
        const resource = diagnosisMap.get(item.resourceId)!;
        return {
          id: crypto.randomUUID(),
          consultationId,
          resourceId: resource.id,
          releaseId: resource.releaseId,
          codeSnapshot: resource.code,
          nameSnapshot: resource.name,
          codingSystemSnapshot: resource.codingSystem,
          codingSystemVersionSnapshot: resource.codingSystemVersion,
          sourceSnapshot: resource.source,
          sourceIdentifierSnapshot: resource.sourceIdentifier,
          releaseVersionSnapshot: resource.releaseSourceVersion ?? resource.sourceVersion,
          notes: item.notes?.trim() || null,
          sortOrder: index,
          selectedBy: session.user.id,
          createdAt: now,
        };
      }));
    }

    const requestValues = [
      ...laboratoryRequests.map((item, index) => ({ item, index, resource: laboratoryMap.get(item.resourceId)!, domain: "laboratory" as const })),
      ...radiologyRequests.map((item, index) => ({ item, index, resource: radiologyMap.get(item.resourceId)!, domain: "radiology" as const })),
    ];
    if (requestValues.length > 0) {
      await tx.insert(consultationRequests).values(requestValues.map(({ item, index, resource, domain }) => ({
        id: crypto.randomUUID(),
        consultationId,
        domain,
        resourceId: resource.id,
        releaseId: resource.releaseId,
        codeSnapshot: resource.code,
        nameSnapshot: resource.name,
        categorySnapshot: resource.category,
        modalitySnapshot: resource.modality,
        sourceSnapshot: resource.source,
        sourceIdentifierSnapshot: resource.sourceIdentifier,
        releaseVersionSnapshot: resource.releaseSourceVersion ?? resource.sourceVersion,
        notes: item.notes?.trim() || null,
        status: "requested",
        sortOrder: index,
        requestedBy: session.user.id,
        createdAt: now,
      })));
    }

    if (prescriptionItems.length > 0) {
      await tx.insert(prescriptions).values(prescriptionItems.map((item, index) => {
        const resource = medicationMap.get(item.resourceId)!;
        return {
          id: crypto.randomUUID(),
          patientId: consultation.patientId,
          clinicianId: session.user.id,
          medication: resource.name,
          dosage: item.dosage.trim(),
          frequency: item.frequency.trim(),
          instructions: item.instructions?.trim() || null,
          startDate: todayDateString(),
          endDate: null,
          status: "active",
          refillsRemaining: 0,
          refillsTotal: 0,
          consultationId,
          catalogueResourceId: resource.id,
          catalogueReleaseId: resource.releaseId,
          genericNameSnapshot: resource.genericName,
          brandNameSnapshot: resource.brandName,
          strengthSnapshot: resource.strength,
          dosageFormSnapshot: resource.dosageForm,
          routeSnapshot: resource.route,
          sourceSnapshot: resource.source,
          sourceIdentifierSnapshot: resource.sourceIdentifier,
          releaseVersionSnapshot: resource.releaseSourceVersion ?? resource.sourceVersion,
          dosageForm: item.dosageForm?.trim() || resource.dosageForm,
          duration: item.duration?.trim() || null,
          route: item.route?.trim() || resource.route,
          sortOrder: index,
          selectedBy: session.user.id,
          createdAt: now,
          updatedAt: now,
        };
      }));
    }

    await tx.update(consultations)
      .set({ status: "completed", completedAt: now, followUpDate, updatedAt: now })
      .where(eq(consultations.id, consultationId));

    await tx.insert(consultationStatusHistory).values({
      id: crypto.randomUUID(),
      consultationId,
      status: "completed",
      changedBy: session.user.id,
      createdAt: now,
    });
  });

  await createNotification(
    consultation.patientId,
    "consultation_completed",
    "Consultation Completed",
    "Your consultation has been completed. View the notes and documents.",
    `/dashboard/patient/consultations/${consultationId}`,
  );
  await sendEmail({
    to: session.user.email,
    subject: "Your consultation is complete",
    template: "consultation-booked",
    props: {
      recipientName: session.user.name,
      title: consultation.title,
      consultationUrl: appUrl(`/dashboard/patient/consultations/${consultationId}`),
      role: "patient",
    },
  }).catch(() => undefined);

  revalidatePath(`/dashboard/clinician/consultations/${consultationId}`);
  revalidatePath(`/dashboard/patient/consultations/${consultationId}`);
  revalidatePath("/dashboard/clinician/consultations");
  revalidatePath("/dashboard/patient/consultations");
  revalidatePath("/dashboard/patient/prescriptions");
  return { success: true };
}

export async function getCommunicationLink(consultationId: string) {
  const session = await getSession();
  const rows = await db.select().from(consultations).where(eq(consultations.id, consultationId)).limit(1);
  if (rows.length === 0) throw new Error("Consultation not found");

  const c = rows[0];
  const canAccess = c.patientId === session.user.id || c.clinicianId === session.user.id;
  if (!canAccess) throw new Error("Access denied");
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

  revalidatePath(`/dashboard/${session.user.role}/consultations/${consultationId}`);
  return { type: "whatsapp" as const, url: whatsappUrl };
}
