import { NextResponse } from "next/server";
import crypto from "crypto";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { consultations, orders, payments } from "@/db/schema";
import { completeOrderByReference } from "@/lib/payments/complete-order";
import { completeConsultationPaymentByReference } from "@/lib/payments/complete-consultation";

function validSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = crypto.createHmac("sha512", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}

/** Paystack is a trigger only; database records and a fresh API verification are authoritative. */
export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const body = await request.text();
  if (!validSignature(body, request.headers.get("x-paystack-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const reference = event.data?.reference;
  if (!reference) return NextResponse.json({ status: "ignored" });

  try {
    if (event.event === "charge.success") {
      const [order] = await db
        .select({ id: orders.id })
        .from(orders)
        .where(or(eq(orders.paymentReference, reference), eq(orders.paystackReference, reference)))
        .limit(1);
      if (order) {
        await completeOrderByReference(reference);
        return NextResponse.json({ status: "ok" });
      }

      const [consultation] = await db
        .select({ id: consultations.id })
        .from(consultations)
        .where(eq(consultations.paystackReference, reference))
        .limit(1);
      if (consultation) await completeConsultationPaymentByReference(reference);
      return NextResponse.json({ status: "ok" });
    }

    const failedStatus = event.event === "charge.abandoned" ? "abandoned" : event.event === "charge.failed" ? "failed" : null;
    if (failedStatus) {
      await db.update(payments)
        .set({ status: failedStatus, failedAt: new Date(), failureReason: failedStatus, updatedAt: new Date() })
        .where(eq(payments.paystackReference, reference));

      await db.update(orders)
        .set({ paymentStatus: failedStatus, updatedAt: new Date() })
        .where(and(or(eq(orders.paymentReference, reference), eq(orders.paystackReference, reference)), eq(orders.paymentStatus, "pending")));
    }

    return NextResponse.json({ status: "ok" });
  } catch {
    // Returning a non-2xx response makes Paystack retry the event. The body is
    // deliberately not logged because it contains payment and customer data.
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
