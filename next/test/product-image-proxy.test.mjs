import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const source = async (path) => readFile(new URL(path, root), "utf8");

test("product image URLs are routed through the internal /api/media proxy", async () => {
  const sanitize = await source("lib/strapi/sanitizeProduct.ts");

  // R2 object URLs are identified by hostname and rewritten to the proxy.
  assert.match(sanitize, /\.r2\.cloudflarestorage\.com/);
  assert.match(sanitize, /\/api\/media\//);

  // The object key is built with a real "/" separator (the filename is
  // encoded on its own, so the whole prefix/filename is not collapsed into a
  // single percent-encoded %2F segment).
  assert.match(sanitize, /api\/media\/\$\{prefix\}\/\$\{encodeURIComponent\(filename\)\}/);

  // Raw R2 object URLs must not be returned to the client.
  assert.doesNotMatch(sanitize, /return \.\.\.media, url: media\.url/);
});
