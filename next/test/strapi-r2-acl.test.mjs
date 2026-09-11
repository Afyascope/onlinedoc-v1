import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const source = async (path) => readFile(new URL(path, root), "utf8");

test("Strapi R2 upload config does not request public-read ACL", async () => {
  const config = await source("../strapi/config/plugins.ts");

  // Explicit private ACL is present (compatible with Cloudflare R2).
  assert.match(config, /ACL:\s*['"]private['"]/);

  // No ACL is ever assigned the provider's unsafe public-read default.
  assert.doesNotMatch(config, /ACL\s*:\s*['"]public[-_]read['"]/);
});
