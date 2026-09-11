import "server-only";

import { db } from "@/db";
import { orders, orderItems, payments, notifications, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { getPaymentProvider } from "@/lib/payments";
import { appUrl, sendEmail } from "@/lib/email/send";

export type CompleteOrderStatus =
  | "paid"
  | "pending"
  | "failed"
  | "cancelled"
  | "not_found";

export interface CompleteOrderResult {
  success: boolean;
  status: CompleteOrderStatus;
  orderId?: string;
  error?: string;
  already?: boolean;
}

/**
 * Idempotently completes a marketplace order for a given Paystack reference.
 *
 * Called from both the Paystack webhook and the client-side callback path so
 * that whichever arrives first (or both) produces exactly one paid order, one
 * payment record, one set of notifications, and one receipt email.
 *
 * Never marks an order paid unless Paystack independently confirms a
 * successful transaction with a matching amount and currency.
 */
export async function completeOrderByReference(reference: string): Promise<CompleteOrderResult> {
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.paymentReference, reference))
    .limit(1);

  if (orderRows.length === 0) {
    return { success: false, status: "not_found", error: "Order not found" };
  }

  const order = orderRows[0];

  // Already fulfilled — return the existing successful state without
  // creating a duplicate payment, entitlement, or receipt.
  if (order.paymentStatus === "paid") {
    return { success: true, status: "paid", already: true, orderId: order.id };
  }

  // Independent server-side verification — never trust the browser redirect
  // or the webhook event alone.
  let verification;
  try {
    const provider = getPaymentProvider();
    verification = await provider.verifyPayment(reference);
  } catch (e) {
    console.error("[payments] verification unavailable:", e instanceof Error ? e.message : e);
    return { success: false, status: "pending", error: "Payment verification unavailable" };
  }

  if (verification.reference !== reference) {
    return { success: false, status: "failed", error: "Payment reference mismatch" };
  }

  // Map the Paystack transaction status to a fulfilment state.
  if (!verification.success) {
    const status = verification.status;
    if (status === "failed" || status === "abandoned") {
      await db.update(orders).set({ paymentStatus: status, updatedAt: new Date() }).where(and(eq(orders.id, order.id), eq(orders.paymentStatus, "pending")));
      return { success: false, status: status === "abandoned" ? "cancelled" : "failed", error: `Payment ${status}` };
    }
    // "pending", "processing", "unknown", "error", or any other non-success
    // state keeps the order pending and does not grant the download.
    return { success: false, status: "pending", error: "Payment not yet confirmed" };
  }

  // Amount and currency must match the order created at checkout time,
  // compared in integer minor units to avoid floating-point drift.
  const expectedMinor = Math.round(Number(order.totalAmount) * 100);
  const actualMinor =
    verification.amount !== undefined ? Math.round(verification.amount * 100) : undefined;

  if (actualMinor === undefined || actualMinor !== expectedMinor) {
    return { success: false, status: "failed", error: "Payment amount mismatch" };
  }
  if (!verification.currency || verification.currency.toUpperCase() !== order.currency.toUpperCase()) {
    return { success: false, status: "failed", error: "Payment currency mismatch" };
  }

  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // The conditional update is the idempotency gate. Only the request that
  // changes the order from pending may create notifications or fulfilment.
  const fulfilled = await db.transaction(async (tx) => {
    const updated = await tx
      .update(orders)
      .set({
        paymentStatus: "paid",
        paymentChannel: verification.channel ?? null,
        receiptUrl: verification.receiptUrl ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, order.id), eq(orders.paymentStatus, "pending")))
      .returning({ id: orders.id });

    if (updated.length === 0) return null;

    const paymentUpdate = await tx
      .update(payments)
      .set({
        status: "successful",
        method: verification.channel || "card",
        channel: verification.channel ?? null,
        amount: order.totalAmount,
        currency: order.currency,
        invoiceNumber,
        receiptUrl: verification.receiptUrl ?? null,
        transactionReference: reference,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.paystackReference, reference))
      .returning({ id: payments.id });
    if (paymentUpdate.length === 0) await tx.insert(payments).values({
        id: crypto.randomUUID(),
        patientId: order.userId,
        orderId: order.id,
        amount: order.totalAmount,
        currency: order.currency,
        status: "successful",
        method: verification.channel || "card",
        channel: verification.channel ?? null,
        transactionReference: reference,
        paystackReference: reference,
        invoiceNumber,
        receiptUrl: verification.receiptUrl ?? null,
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const userRows = await tx.select().from(user).where(eq(user.id, order.userId)).limit(1);
    for (const item of items) {
      await tx.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: order.userId,
        type: "purchase_successful",
        title: "Purchase successful",
        body: `${item.productName || "Product"} has been added to your library.`,
        link: "/dashboard/patient/library",
        createdAt: new Date(),
      });
    }
    return { items, recipient: userRows[0] };
  });

  if (!fulfilled) {
    return { success: true, status: "paid", already: true, orderId: order.id };
  }

  if (fulfilled.recipient?.email) {
    await sendEmail({
      to: fulfilled.recipient.email,
      subject: "Your OnlineDoc purchase is confirmed",
      template: "marketplace-receipt",
      props: {
        name: fulfilled.recipient.name,
        orderId: order.id,
        items: fulfilled.items.map((item) => ({
          name: item.productName || "Digital product",
          quantity: item.quantity,
          price: item.price,
        })),
        total: order.totalAmount,
        currency: order.currency,
        libraryUrl: appUrl("/dashboard/patient/library"),
      },
    });
  }

  return { success: true, status: "paid", orderId: order.id };
}
