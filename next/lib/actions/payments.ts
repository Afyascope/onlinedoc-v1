"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { consultations, payments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { getPaymentProvider } from "@/lib/payments";
import { completeConsultationPaymentByReference } from "@/lib/payments/complete-consultation";
import { appUrl as configuredAppUrl, paystackCurrency } from "@/lib/config";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session;
}

export async function initiateConsultationPayment(
  consultationId: string,
  paymentMethod?: string,
  phone?: string,
) {
  const session = await getSession();

  const rows = await db.select().from(consultations).where(eq(consultations.id, consultationId)).limit(1);
  if (rows.length === 0) throw new Error("Consultation not found");
  if (rows[0].patientId !== session.user.id) throw new Error("Access denied");
  if (rows[0].status !== "draft" && rows[0].status !== "awaiting_payment") {
    throw new Error("Invalid consultation status for payment");
  }

  const consultation = rows[0];
  const fee = Number(consultation.fee);
  if (!Number.isFinite(fee) || fee < 0) throw new Error("Invalid consultation fee");
  const provider = getPaymentProvider();

  const baseUrl = configuredAppUrl();
  const currency = paystackCurrency();

  const result = await provider.createCheckout({
    amount: fee,
    currency,
    email: session.user.email || "patient@onlinedoc.com",
    paymentMethod: paymentMethod as any,
    phone,
    metadata: {
      consultation_id: consultationId,
      user_id: session.user.id,
      order_type: "consultation",
    },
    successUrl: `${baseUrl}/dashboard/patient/consultations/${consultationId}?payment=success`,
    cancelUrl: `${baseUrl}/dashboard/patient/consultations/${consultationId}/payment?cancelled=true`,
  });

  if (!result.success) {
    return { success: false, error: result.error || "Payment initiation failed" };
  }

  await db.update(consultations)
    .set({
      status: "awaiting_payment",
      paystackReference: result.reference,
      updatedAt: new Date(),
    })
    .where(eq(consultations.id, consultationId));

  await db.insert(payments).values({
    id: crypto.randomUUID(),
    patientId: session.user.id,
    consultationId,
    amount: consultation.fee,
    currency,
    status: "pending",
    method: paymentMethod || null,
    paystackReference: result.reference,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing({ target: payments.paystackReference });

  revalidatePath(`/dashboard/patient/consultations/${consultationId}`);
  return {
    success: true,
    url: result.url,
    reference: result.reference,
    accessCode: result.accessCode,
  };
}

export async function verifyConsultationPayment(consultationId: string) {
  const session = await getSession();

  const rows = await db.select().from(consultations).where(eq(consultations.id, consultationId)).limit(1);
  if (rows.length === 0) throw new Error("Consultation not found");

  const consultation = rows[0];
  if (consultation.patientId !== session.user.id) throw new Error("Access denied");
  if (!consultation.paystackReference) throw new Error("No payment reference found");

  const result = await completeConsultationPaymentByReference(consultation.paystackReference);

  revalidatePath("/dashboard/patient/consultations");
  return result;
}

export async function retryConsultationPayment(consultationId: string) {
  const session = await getSession();

  const rows = await db.select().from(consultations).where(eq(consultations.id, consultationId)).limit(1);
  if (rows.length === 0) throw new Error("Consultation not found");
  if (rows[0].patientId !== session.user.id) throw new Error("Access denied");

  await db.update(consultations).set({
    status: "draft",
    paystackReference: null,
    paymentChannel: null,
    updatedAt: new Date(),
  }).where(eq(consultations.id, consultationId));

  revalidatePath(`/dashboard/patient/consultations/${consultationId}/payment`);
  return { success: true };
}

export async function getPaymentHistory() {
  const session = await getSession();

  return db
    .select()
    .from(payments)
    .where(eq(payments.patientId, session.user.id))
    .orderBy(payments.createdAt)
    .limit(50);
}

export async function getPaymentByConsultation(consultationId: string) {
  const session = await getSession();

  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.consultationId, consultationId))
    .limit(1);
  if (!rows[0] || rows[0].patientId !== session.user.id) return null;
  return rows[0];
}

export async function checkPaymentStatus(reference: string) {
  const session = await getSession();
  if (!reference) return { success: false, error: "No reference" };

  const rows = await db
    .select()
    .from(payments)
    .where(and(eq(payments.paystackReference, reference), eq(payments.patientId, session.user.id)))
    .limit(1);

  if (rows.length > 0) {
    return {
      success: rows[0].status === "successful" || rows[0].status === "completed",
      status: rows[0].status,
      channel: rows[0].channel,
      receiptUrl: rows[0].receiptUrl,
      invoiceNumber: rows[0].invoiceNumber,
    };
  }

  return { success: false, status: "not_found" };
}
