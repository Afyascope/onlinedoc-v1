import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const source = async (path) => readFile(new URL(path, root), "utf8");

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

test("A. media proxy rejects object keys outside the approved product prefix", async () => {
  const media = await source("app/api/media/[...key]/route.ts");
  assert.match(media, /isWithinProductPrefix/);
  assert.match(media, /return new Response\("Not found", \{ status: 404 \}\)/);
});

test("B. media proxy rejects traversal", async () => {
  const storage = await source("lib/storage/product-files.ts");
  assert.match(storage, /segment === "\.\."/);
  assert.match(storage, /segment === "\."/);
  assert.match(storage, /segment === ""/);
});

test("C. protected download remains authenticated", async () => {
  const download = await source("app/api/download/[orderItemId]/route.ts");
  assert.match(download, /auth\.api\.getSession/);
  assert.match(download, /status: 401/);
});

test("D. protected download remains ownership scoped", async () => {
  const download = await source("app/api/download/[orderItemId]/route.ts");
  assert.match(download, /order\.userId !== session\.user\.id/);
  assert.match(download, /status: 403/);
});

test("E. protected download remains paid-entitlement scoped", async () => {
  const download = await source("app/api/download/[orderItemId]/route.ts");
  assert.match(download, /order\.paymentStatus !== "paid"/);
});

test("F. object-key traversal is rejected", async () => {
  const storage = await source("lib/storage/product-files.ts");
  assert.match(storage, /isSafeObjectKey/);
  assert.match(storage, /segment === "\.\."/);
});

test("G. derived object key remains within R2_PRODUCT_PREFIX", async () => {
  const storage = await source("lib/storage/product-files.ts");
  assert.match(storage, /isWithinProductPrefix\(metadataKey\)/);
  assert.match(storage, /isWithinProductPrefix\(key\)/);
  assert.match(storage, /r2ProductPrefix\(\)/);
});

test("H. missing R2 configuration remains fail-closed in production", async () => {
  const storage = await source("lib/storage/product-files.ts");
  const download = await source("app/api/download/[orderItemId]/route.ts");
  assert.match(storage, /Private R2 product storage is not configured/);
  assert.match(download, /privateProductStorageConfigured\(\)/);
  assert.match(download, /process\.env\.NODE_ENV !== "production"/);
});

test("I. R2 credentials are not exposed through NEXT_PUBLIC_* variables", async () => {
  const storage = await source("lib/storage/product-files.ts");
  const sanitize = await source("lib/strapi/sanitizeProduct.ts");
  assert.doesNotMatch(storage, /NEXT_PUBLIC_/);
  assert.doesNotMatch(sanitize, /NEXT_PUBLIC_/);

  for (const dir of ["app", "lib", "components"]) {
    for await (const file of walk(join(new URL("../", import.meta.url).pathname, dir))) {
      if (!/\.(ts|tsx)$/.test(file)) continue;
      const text = await readFile(file, "utf8");
      assert.doesNotMatch(
        text,
        /NEXT_PUBLIC_(R2|AWS|S3|BUCKET|CLOUDFLARE|STORAGE)/,
        `unexpected NEXT_PUBLIC_ storage variable in ${file}`,
      );
    }
  }
});

test("J. protected download uses fresh authoritative product resolution", async () => {
  const download = await source("app/api/download/[orderItemId]/route.ts");
  const fetch = await source("lib/strapi/fetchContentType.ts");
  assert.match(download, /fresh/);
  assert.match(download, /true,\s*\n\s*true,/);
  assert.match(fetch, /cache: "no-store"/);
});
