import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const source = async (path) => readFile(new URL(path, root), "utf8");

test("registration cannot accept a browser-supplied role", async () => {
  const auth = await source("lib/auth.ts");
  assert.match(auth, /role:[\s\S]*?input:\s*false/);
});

test("seed endpoint is disabled in production and uses environment credentials", async () => {
  const seed = await source("app/api/seed/route.ts");
  assert.match(seed, /NODE_ENV === "production"/);
  assert.match(seed, /status: 404/);
  assert.doesNotMatch(seed, /Admin@123|Clinician@123|Patient@123/);
});

test("clinician consultation access is assignment-scoped", async () => {
  const page = await source("app/[locale]/(authenticated)/dashboard/clinician/consultations/[id]/page.tsx");
  const actions = await source("lib/actions/consultations.ts");
  assert.match(page, /c\.clinicianId !== userId/);
  assert.match(actions, /session\.user\.role === "clinician" && consultation\.clinicianId !== session\.user\.id/);
  assert.match(actions, /consultationRows\[0\]\.clinicianId !== session\.user\.id/);
});

test("patient resources use the authenticated patient identity", async () => {
  const orders = await source("lib/actions/orders.ts");
  const downloads = await source("app/api/download/[orderItemId]/route.ts");
  const paymentActions = await source("lib/actions/payments.ts");
  assert.match(orders, /eq\(orders\.userId, session\.user\.id\)/);
  assert.match(downloads, /order\.userId !== session\.user\.id/);
  assert.match(paymentActions, /consultation\.patientId !== session\.user\.id/);
});

test("Paystack completion verifies gateway identity and transaction values", async () => {
  const orderCompletion = await source("lib/payments/complete-order.ts");
  const consultationCompletion = await source("lib/payments/complete-consultation.ts");
  const webhook = await source("app/api/payments/webhook/route.ts");
  assert.match(orderCompletion, /verification\.reference !== reference/);
  assert.match(orderCompletion, /Payment amount mismatch/);
  assert.match(orderCompletion, /Payment currency mismatch/);
  assert.match(consultationCompletion, /verification\.reference !== reference/);
  assert.match(consultationCompletion, /Payment ownership mismatch/);
  assert.match(webhook, /timingSafeEqual/);
  assert.doesNotMatch(webhook, /metadata\.order_id|metadata\.consultation_id/);
});

test("fulfilment is idempotency-gated and product files fail closed in production", async () => {
  const completion = await source("lib/payments/complete-order.ts");
  const download = await source("app/api/download/[orderItemId]/route.ts");
  assert.match(completion, /eq\(orders\.paymentStatus, "pending"\)/);
  assert.match(completion, /status: "successful"/);
  assert.match(download, /order\.paymentStatus !== "paid"/);
  assert.match(download, /process\.env\.NODE_ENV !== "production"/);
});

test("production builds do not suppress TypeScript or ESLint failures", async () => {
  const config = await source("next.config.mjs");
  assert.doesNotMatch(config, /ignoreDuringBuilds|ignoreBuildErrors/);
});
