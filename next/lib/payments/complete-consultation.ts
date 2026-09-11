import "server-only";

import { db } from "@/db";
import { consultations, notifications, payments, user } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import crypto from "crypto";
import { getPaymentProvider } from "@/lib/payments";
import { appUrl, sendEmail } from "@/lib/email/send";
import { paystackCurrency } from "@/lib/config";

export type ConsultationPaymentResult = {
  success: boolean;
  status: "paid" | "pending" | "failed" | "abandoned" | "not_found";
  already?: boolean;
  error?: string;
};

/** Verify and fulfil a consultation payment using only server-side records. */
export async function completeConsultationPaymentByReference(
  reference: string,
): Promise<ConsultationPaymentResult> {
  const rows = await db
    .select()
    .from(consultations)
    .where(eq(consultations.paystackReference, reference))
    .limit(1);
  const consultation = rows[0];
  if (!consultation) return { success: false, status: "not_found", error: "Consultation payment not found" };

  if (consultation.status === "paid" || consultation.status === "waiting_for_clinician" || consultation.status === "in_consultation" || consultation.status === "completed" || consultation.status === "closed") {
    return { success: true, status: "paid", already: true };
  }

  const patientRows = await db.select().from(user).where(eq(user.id, consultation.patientId)).limit(1);
  const patient = patientRows[0];
  if (!patient) return { success: false, status: "not_found", error: "Patient not found" };

  const verification = await getPaymentProvider().verifyPayment(reference);
  if (verification.reference !== reference) {
    return { success: false, status: "failed", error: "Payment reference mismatch" };
  }

  const expectedCurrency = paystackCurrency();
  const expectedMinor = Math.round(Number(consultation.fee) * 100);
  const actualMinor = verification.amount === undefined ? undefined : Math.round(verification.amount * 100);
  if (!verification.currency || verification.currency.toUpperCase() !== expectedCurrency.toUpperCase()) {
    return { success: false, status: "failed", error: "Payment currency mismatch" };
  }
  if (actualMinor === undefined || actualMinor !== expectedMinor) {
    return { success: false, status: "failed", error: "Payment amount mismatch" };
  }
  if (verification.customerEmail && verification.customerEmail.toLowerCase() !== patient.email.toLowerCase()) {
    return { success: false, status: "failed", error: "Payment ownership mismatch" };
  }

  if (!verification.success) {
    const status = verification.status === "abandoned" ? "abandoned" : "failed";
    await db.update(payments).set({ status, failedAt: new Date(), failureReason: verification.gatewayResponse || status, updatedAt: new Date() }).where(eq(payments.paystackReference, reference));
    return { success: false, status, error: `Payment ${status}` };
  }

  const invoiceNumber = `INV-CON-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const fulfilled = await db.transaction(async (tx) => {
    const updated = await tx
      .update(consultations)
      .set({ status: "paid", paymentChannel: verification.channel ?? null, paidAt: new Date(), updatedAt: new Date() })
      .where(and(eq(consultations.id, consultation.id), eq(consultations.status, "awaiting_payment")))
      .returning({ id: consultations.id });
    if (updated.length === 0) return false;

    const paymentUpdate = await tx
      .update(payments)
      .set({
        status: "successful",
        method: verification.channel || "card",
        channel: verification.channel ?? null,
        transactionReference: reference,
        amount: consultation.fee,
        currency: expectedCurrency,
        invoiceNumber,
        receiptUrl: verification.receiptUrl ?? null,
        paidAt: verification.paidAt ? new Date(verification.paidAt) : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.paystackReference, reference))
      .returning({ id: payments.id });
    if (paymentUpdate.length === 0) {
      await tx.insert(payments).values({
        id: crypto.randomUUID(),
        patientId: consultation.patientId,
        consultationId: consultation.id,
        amount: consultation.fee,
        currency: expectedCurrency,
        status: "successful",
        method: verification.channel || "card",
        channel: verification.channel ?? null,
        transactionReference: reference,
        paystackReference: reference,
        invoiceNumber,
        receiptUrl: verification.receiptUrl ?? null,
        paidAt: verification.paidAt ? new Date(verification.paidAt) : new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await tx.insert(notifications).values({
      id: crypto.randomUUID(),
      userId: consultation.patientId,
      type: "payment_received",
      title: "Payment Successful",
      body: `Your consultation payment has been confirmed. Invoice: ${invoiceNumber}`,
      link: `/dashboard/patient/consultations/${consultation.id}`,
      createdAt: new Date(),
    });
    return true;
  });

  if (!fulfilled) return { success: true, status: "paid", already: true };

  await sendEmail({
    to: patient.email,
    subject: "Your consultation payment is confirmed",
    template: "consultation-booked",
    props: {
      recipientName: patient.name,
      title: consultation.title,
      consultationUrl: appUrl(`/dashboard/patient/consultations/${consultation.id}`),
      role: "patient",
    },
  });

  return { success: true, status: "paid" };
}
