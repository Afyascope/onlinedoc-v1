/**
 * Server-side sanitization for Strapi product data before it is serialized to
 * the browser.
 *
 * The downloadable file URL (`file.url`) is server-only. The secure download
 * route (`/api/download/[orderItemId]`) is the only access mechanism and it
 * re-resolves the file authoritatively from Strapi. The browser only needs to
 * know whether a file exists and its type label (`mime` / `ext`).
 *
 * Product images are intentionally left untouched — their URLs are required to
 * render the marketplace.
 *
 * `dynamic_zone` is also dropped from client-bound products: it is rendered
 * server-side via `DynamicZoneManager`, and dropping it avoids serializing the
 * (potentially recursive) product relations that carry `file.url`.
 */

export function toClientProduct(product: any): any {
  if (!product) return product;

  const file = product.file;
  const safeFile = file
    ? { mime: file.mime ?? null, ext: file.ext ?? null }
    : null;

  const { dynamic_zone, images, ...rest } = product;
  return { ...rest, images: Array.isArray(images) ? images.map(clientMedia) : images, file: safeFile };
}

export function toClientProducts(products: any[]): any[] {
  return (products ?? []).map(toClientProduct);
}

/**
 * Strips server-only file metadata from product relations embedded in a
 * product dynamic zone (e.g. `dynamic-zone.related-products`).
 */
export function sanitizeProductDynamicZone(dynamicZone: any[]): any[] {
  return (dynamicZone ?? []).map((component) => {
    if (
      component?.__component === "dynamic-zone.related-products" &&
      Array.isArray(component.products)
    ) {
      return { ...component, products: toClientProducts(component.products) };
    }
    return component;
  });
}
function clientMedia(media: any): any {
  if (!media || typeof media !== "object") return media;
  if (process.env.R2_ENDPOINT && media.url) {
    const source = String(media.url).split("?")[0];
    const filename = source.split("/").filter(Boolean).pop();
    const prefix = (process.env.R2_PRODUCT_PREFIX || "products/").replace(/\/$/, "");
    if (filename) return { ...media, url: `/api/media/${encodeURIComponent(`${prefix}/${filename}`)}` };
  }
  return media;
}
