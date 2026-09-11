import "server-only";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

let client: S3Client | undefined;

function r2Client(): S3Client {
  if (!process.env.R2_ENDPOINT || !process.env.R2_BUCKET || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error("Private R2 product storage is not configured");
  }
  client ??= new S3Client({
    endpoint: process.env.R2_ENDPOINT,
    region: "auto",
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

/**
 * Normalized product prefix, always with a single trailing slash and no
 * leading slash, e.g. `products/`. Defaults to `products/` and falls back to
 * an empty string only if the operator explicitly clears the prefix (which is
 * treated as fail-closed: nothing is then considered "within the prefix").
 */
export function r2ProductPrefix(): string {
  const raw = process.env.R2_PRODUCT_PREFIX || "products/";
  const trimmed = raw.replace(/^\/+/, "").replace(/\/+$/, "");
  return trimmed ? `${trimmed}/` : "";
}

/**
 * Rejects keys that are empty or contain traversal/empty segments. A leading
 * slash, a double slash, `.` or `..` segments all fail here.
 */
export function isSafeObjectKey(key: string): boolean {
  if (typeof key !== "string" || key.length === 0) return false;
  const segments = key.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    return false;
  }
  return true;
}

/**
 * True only when the key is safe and lives inside the product prefix. Used by
 * both the protected download path and the public media proxy so neither can
 * reach an arbitrary object outside `R2_PRODUCT_PREFIX`.
 */
export function isWithinProductPrefix(key: string): boolean {
  if (!isSafeObjectKey(key)) return false;
  const prefix = r2ProductPrefix();
  if (!prefix) return false;
  return key.startsWith(prefix);
}

/**
 * Resolves the canonical R2 object key for a Strapi file record.
 *
 * The Strapi S3/R2 upload provider stores the authoritative key in
 * `provider_metadata.key`; that value is preferred. Only when it is absent is
 * the key reconstructed from the file URL's final path segment (Strapi stores
 * uploads flat under `rootPath`, so the object name is the final segment).
 *
 * In both cases the result must be a safe key inside `R2_PRODUCT_PREFIX`,
 * otherwise `null` is returned and the caller fails closed.
 */
export function r2ObjectKey(file: any): string | null {
  const metadataKey = file?.provider_metadata?.key || file?.provider_metadata?.Key;
  if (typeof metadataKey === "string" && isWithinProductPrefix(metadataKey)) {
    return metadataKey;
  }

  const source = typeof file?.url === "string" ? file.url : "";
  if (!source) return null;

  let filename: string | null = null;
  try {
    const pathname = source.startsWith("http") ? new URL(source).pathname : source;
    const last = pathname.split("/").filter(Boolean).pop();
    if (!last) return null;
    filename = decodeURIComponent(last);
  } catch {
    return null;
  }

  const key = `${r2ProductPrefix()}${filename}`;
  return isWithinProductPrefix(key) ? key : null;
}

export async function getPrivateProductFile(file: any): Promise<ReadableStream<Uint8Array> | null> {
  const key = r2ObjectKey(file);
  if (!key || !isWithinProductPrefix(key)) return null;
  const result = await r2Client().send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
  if (!result.Body) return null;
  return result.Body.transformToWebStream() as ReadableStream<Uint8Array>;
}

export async function getPrivateR2Object(key: string) {
  if (!isSafeObjectKey(key)) return null;
  return r2Client().send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
}

export function privateProductStorageConfigured(): boolean {
  return Boolean(
    process.env.R2_ENDPOINT &&
    process.env.R2_BUCKET &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY,
  );
}
