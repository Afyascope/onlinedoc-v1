import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const source = async (path) => readFile(new URL(path, root), "utf8");

test("free-product email is non-blocking (fire-and-forget)", async () => {
  const orders = await source("lib/actions/orders.ts");

  // The free claim sends the notification without awaiting it.
  assert.match(orders, /void\s+sendEmail\s*\(/);
  assert.match(orders, /\.catch\s*\(/);

  // It must never be awaited, so an SMTP outage cannot block the success
  // response or the patient redirect.
  assert.doesNotMatch(orders, /await\s+sendEmail\s*\(/);
});

test("SMTP transporter has explicit fail-fast timeouts", async () => {
  const smtp = await source("lib/email/smtp.ts");
  assert.match(smtp, /connectionTimeout:\s*10000/);
  assert.match(smtp, /socketTimeout:\s*10000/);
  assert.match(smtp, /greetingTimeout:\s*10000/);
});
