"use server";

import { db } from "@/db";
import { downloads, orderItems, orders } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session;
}

export async function listDownloads() {
  const session = await getSession();

  const rows = await db
    .select({
      download: downloads,
      orderItem: orderItems,
    })
    .from(downloads)
    .innerJoin(orderItems, eq(downloads.orderItemId, orderItems.id))
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.userId, session.user.id),
        eq(orders.paymentStatus, "paid"),
      ),
    )
    .orderBy(desc(downloads.createdAt));

  return rows.map((r) => ({
    downloadId: r.download.id,
    orderItemId: r.orderItem.id,
    downloadCount: r.download.downloadCount,
    lastDownloadedAt: r.download.lastDownloadedAt,
    productId: r.orderItem.productId,
    productName: r.orderItem.productName || "Product",
    productSlug: r.orderItem.productSlug || "",
    orderId: r.orderItem.orderId,
    createdAt: r.download.createdAt,
  }));
}
