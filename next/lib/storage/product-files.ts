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

export function r2ObjectKey(file: any): string | null {
  const metadataKey = file?.provider_metadata?.key || file?.provider_metadata?.Key;
  if (typeof metadataKey === "string" && metadataKey) return metadataKey;
  const source = typeof file?.url === "string" ? file.url : "";
  if (!source) return null;
  const pathname = source.startsWith("http") ? new URL(source).pathname : source;
  const filename = pathname.split("/").filter(Boolean).pop();
  if (!filename) return null;
  const prefix = process.env.R2_PRODUCT_PREFIX || "products/";
  return `${prefix.replace(/\/$/, "")}/${filename}`;
}

export async function getPrivateProductFile(file: any): Promise<ReadableStream<Uint8Array> | null> {
  const key = r2ObjectKey(file);
  if (!key) return null;
  const result = await r2Client().send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
  if (!result.Body) return null;
  return result.Body.transformToWebStream() as ReadableStream<Uint8Array>;
}

export async function getPrivateR2Object(key: string) {
  if (!key || key.split("/").some((part) => part === ".." || part === ".")) return null;
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
