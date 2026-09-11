import {
  getPrivateR2Object,
  isWithinProductPrefix,
  privateProductStorageConfigured,
} from "@/lib/storage/product-files";

/**
 * Serves public product media (cover images/videos) from the private R2
 * bucket. This is intentionally a public namespace so the marketplace can
 * render product imagery without authentication, but it is strictly limited:
 *
 *  - the key must live inside the configured product prefix
 *    (`R2_PRODUCT_PREFIX`, default `products/`);
 *  - traversal (`..`, `.`, empty) segments are rejected;
 *  - only `image/*` and `video/*` objects are streamed, so protected digital
 *    product files (PDFs and other documents) can never be returned here.
 */
export async function GET(
  _request: Request,
  { params }: { params: { key: string[] } },
) {
  if (!privateProductStorageConfigured()) return new Response("Not found", { status: 404 });

  const key = params.key.join("/");
  if (!isWithinProductPrefix(key)) {
    return new Response("Not found", { status: 404 });
  }

  const object = await getPrivateR2Object(key);
  const contentType = object?.ContentType;
  if (!object?.Body || !contentType?.match(/^(image|video)\//)) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(object.Body.transformToWebStream() as ReadableStream<Uint8Array>, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
