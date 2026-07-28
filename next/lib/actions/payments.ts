"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { consultations, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { updateConsultationStatus } from "./consultations";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session;
}

export async function initiatePayment(consultationId: string) {
  const session = await getSession();

  const rows = await db.select().from(consultations).where(eq(consultations.id, consultationId)).limit(1);
  if (rows.length === 0) throw new Error("Consultation not found");
  if (rows[0].patientId !== session.user.id) throw new Error("Access denied");
  if (rows[0].status !== "draft" && rows[0].status !== "awaiting_payment") {
    throw new Error("Invalid consultation status for payment");
  }

  const consultation = rows[0];
  const fee = Number(consultation.fee || 50);

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  // Stripe mode
  if (stripeSecretKey) {
    try {
      const { default: Stripe } = await import("stripe");
      const stripe = new Stripe(stripeSecretKey);
      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: `Consultation: ${consultation.title}` },
            unit_amount: Math.round(fee * 100),
          },
          quantity: 1,
        }],
        metadata: { consultationId },
        success_url: `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/dashboard/patient/consultations/${consultationId}?payment=success`,
        cancel_url: `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/dashboard/patient/consultations/${consultationId}/payment?cancelled=true`,
      });

      await db.update(consultations)
        .set({ stripeSessionId: checkout.id, status: "awaiting_payment", updatedAt: new Date() })
        .where(eq(consultations.id, consultationId));

      return { success: true, url: checkout.url || "" };
    } catch {
      return { success: false, error: "Payment service unavailable" };
    }
  }

  // Mock payment mode (dev without Stripe keys)
  await db.update(consultations)
    .set({ status: "awaiting_payment", updatedAt: new Date() })
    .where(eq(consultations.id, consultationId));

  return { success: true, url: null, mockPayment: true };
}

export async function verifyPayment(consultationId: string) {
  const session = await getSession();

  const payment = await db.insert(payments).values({
    id: crypto.randomUUID(),
    patientId: session.user.id,
    amount: "50",
    currency: "USD",
    status: "completed",
    method: "stripe",
    description: "Consultation fee",
    paidAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await updateConsultationStatus(consultationId, "paid");
  revalidatePath("/dashboard/patient/consultations");
  return { success: true };
}
