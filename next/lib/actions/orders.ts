"use server";

import { db } from "@/db";
import { orders, orderItems, downloads, notifications, payments } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { getPaymentProvider } from "@/lib/payments";
import { appUrl, sendEmail } from "@/lib/email/send";
import { completeOrderByReference } from "@/lib/payments/complete-order";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { appUrl as configuredAppUrl, paystackCurrency } from "@/lib/config";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session;
}

/**
 * Initiates a marketplace purchase for a Strapi product identified by slug.
 *
 * The product price, name, publication status, and downloadable file are all
 * resolved server-side from Strapi. The browser only ever supplies the slug.
 */
export async function initiateProductPayment(productSlug: string) {
  const session = await getSession();

  if (!productSlug) return { success: false, error: "Product not found" };

  const product = await fetchContentType(
    "products",
    { filters: { slug: productSlug } },
    true,
    true,
  );

  if (!product) return { success: false, error: "Product not found" };
  if (!product.publishedAt) return { success: false, error: "Product unavailable" };

  const price = Number(product.price);
  if (Number.isNaN(price) || price < 0) return { success: false, error: "Invalid product price" };

  const fileUrl = product.file?.url;
  if (!fileUrl) return { success: false, error: "This product has no downloadable file yet" };

  const payCurrency = paystackCurrency();
  const baseUrl = configuredAppUrl();

  // ── Free product: no Paystack, immediate entitlement ──
  if (price === 0) {
    const orderId = crypto.randomUUID();
    const itemId = crypto.randomUUID();

    await db.insert(orders).values({
      id: orderId,
      userId: session.user.id,
      orderType: "digital_product",
      totalAmount: "0",
      currency: payCurrency,
      paymentStatus: "paid",
      paymentProvider: "free",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.insert(orderItems).values({
      id: itemId,
      orderId,
      productId: String(product.id),
      productName: product.name,
      productSlug: product.slug,
      quantity: 1,
      price: "0",
      createdAt: new Date(),
    });
    await db.insert(downloads).values({
      id: crypto.randomUUID(),
      orderItemId: itemId,
      createdAt: new Date(),
    });
    await db.insert(notifications).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      type: "purchase_successful",
      title: "Download available",
      body: `${product.name} is ready to download.`,
      link: "/dashboard/patient/library",
      createdAt: new Date(),
    });
    await sendEmail({
      to: session.user.email,
      subject: "Your OnlineDoc download is ready",
      template: "product-download",
      props: {
        name: session.user.name,
        productName: product.name,
        downloadUrl: appUrl("/dashboard/patient/library"),
      },
    });
    revalidatePath("/dashboard/patient/library");
    return { success: true, url: null, free: true };
  }

  // ── Paid product: server-generated reference linked to the order ──
  const reference = `ORD-${crypto.randomUUID()}`;
  const orderId = crypto.randomUUID();
  const itemId = crypto.randomUUID();

  const provider = getPaymentProvider();
  // Persist the pending order before contacting Paystack so a webhook that
  // arrives immediately after initialization can always resolve it.
  await db.insert(orders).values({
    id: orderId,
    userId: session.user.id,
    orderType: "digital_product",
    totalAmount: String(price),
    currency: payCurrency,
    paymentStatus: "pending",
    paymentProvider: "paystack",
    paymentReference: reference,
    paystackReference: reference,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await db.insert(orderItems).values({
    id: itemId,
    orderId,
    productId: String(product.id),
    productName: product.name,
    productSlug: product.slug,
    quantity: 1,
    price: String(price),
    createdAt: new Date(),
  });
  await db.insert(downloads).values({
    id: crypto.randomUUID(),
    orderItemId: itemId,
    createdAt: new Date(),
  });
  await db.insert(payments).values({
    id: crypto.randomUUID(),
    patientId: session.user.id,
    orderId,
    amount: String(price),
    currency: payCurrency,
    status: "pending",
    paystackReference: reference,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const result = await provider.createCheckout({
    amount: price,
    currency: payCurrency,
    email: session.user.email || "",
    reference,
    // Kenyan checkout: card, bank, USSD, QR, and M-PESA (mobile_money).
    channels: ["card", "bank", "ussd", "qr", "mobile_money"],
    metadata: {
      order_id: orderId,
      product_id: String(product.id),
      product_name: product.name,
      user_id: session.user.id,
      order_type: "digital_product",
    },
    successUrl: `${baseUrl}/dashboard/patient/library`,
    cancelUrl: `${baseUrl}/products/${productSlug}`,
  });

  if (!result.success) {
    await db.update(orders).set({ paymentStatus: "failed", updatedAt: new Date() }).where(eq(orders.id, orderId));
    return { success: false, error: result.error };
  }

  return { success: true, url: result.url, reference };
}

/**
 * Callback-path verification used when the browser returns from Paystack.
 * Independent verification and idempotent completion are handled by
 * completeOrderByReference.
 */
export async function verifyProductPayment(reference: string) {
  const session = await getSession();

  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.paymentReference, reference))
    .limit(1);

  if (orderRows.length === 0) return { success: false, status: "not_found", error: "Order not found" };
  if (orderRows[0].userId !== session.user.id) return { success: false, status: "failed", error: "Forbidden" };

  const result = await completeOrderByReference(reference);

  if (result.success) {
    revalidatePath("/dashboard/patient/library");
    revalidatePath("/dashboard/patient/orders");
  }
  return result;
}

export async function listOrders() {
  const session = await getSession();
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt));
}

export async function getOrder(id: string) {
  const session = await getSession();
  const orderRows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, session.user.id)))
    .limit(1);
  if (orderRows.length === 0) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  return { order: orderRows[0], items };
}
