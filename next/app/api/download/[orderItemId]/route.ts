import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orderItems, orders, downloads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { apiUrl } from "@/lib/config";
import { getPrivateProductFile, privateProductStorageConfigured } from "@/lib/storage/product-files";

function sanitizeFilename(name: string): string {
  return name.replace(/["\r\n\\]/g, "_");
}

export async function GET(
  request: Request,
  { params }: { params: { orderItemId: string } },
) {
  const { orderItemId } = params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const itemRows = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.id, orderItemId))
    .limit(1);

  if (itemRows.length === 0) {
    return new Response("Not found", { status: 404 });
  }
  const item = itemRows[0];

  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, item.orderId))
    .limit(1);

  if (orderRows.length === 0) {
    return new Response("Not found", { status: 404 });
  }
  const order = orderRows[0];

  if (order.userId !== session.user.id) {
    return new Response("Forbidden", { status: 403 });
  }
  if (order.paymentStatus !== "paid") {
    return new Response("Not available", { status: 403 });
  }

  // Resolve the current downloadable file from the authoritative Strapi record.
  // `fresh` forces a no-store lookup so an unpublished product cannot remain
  // downloadable because of the application's Strapi response cache.
  const product = await fetchContentType(
    "products",
    { filters: { slug: item.productSlug || "" } },
    true,
    true,
  );

  const fileUrl = product?.file?.url;
  if (!product || !fileUrl) {
    return new Response("File unavailable", { status: 404 });
  }

  let body: ReadableStream<Uint8Array> | null = null;
  try {
    if (privateProductStorageConfigured()) {
      body = await getPrivateProductFile(product.file);
    } else if (process.env.NODE_ENV !== "production") {
      const absoluteUrl = fileUrl.startsWith("http") ? fileUrl : `${apiUrl()}${fileUrl}`;
      const fileResponse = await fetch(absoluteUrl, { cache: "no-store" });
      if (fileResponse.ok) body = fileResponse.body;
    }
  } catch {
    body = null;
  }
  if (!body) return new Response("File unavailable", { status: 404 });

  // Track the download using the existing downloads table.
  const dl = await db
    .select()
    .from(downloads)
    .where(eq(downloads.orderItemId, orderItemId))
    .limit(1);

  if (dl.length > 0) {
    await db
      .update(downloads)
      .set({
        downloadCount: (dl[0].downloadCount || 0) + 1,
        lastDownloadedAt: new Date(),
      })
      .where(eq(downloads.id, dl[0].id));
  }

  const mime = product.file.mime || "application/pdf";
  const ext = product.file.ext ? `.${product.file.ext.replace(".", "")}` : ".pdf";
  const filename = sanitizeFilename(
    product.file.name || `${product.slug || "product"}${ext}`,
  );

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function OPTIONS() {
  return NextResponse.json({});
}
