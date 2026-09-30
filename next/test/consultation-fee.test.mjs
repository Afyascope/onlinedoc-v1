import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const require = createRequire(import.meta.url);
const ts = require("typescript");
const configSource = await readFile(new URL("lib/config.ts", root), "utf8");
const compiled = ts.transpileModule(configSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function loadFeeResolver(env = {}) {
  const module = { exports: {} };
  vm.runInNewContext(compiled, { module, exports: module.exports, process: { env } });
  return module.exports;
}

test("database consultation fee overrides CONSULTATION_FEE", () => {
  const config = loadFeeResolver({ CONSULTATION_FEE: "50", NODE_ENV: "production" });
  assert.equal(config.consultationFee("100"), "100");
  assert.equal(config.consultationFee("150"), "150");
});

test("CONSULTATION_FEE is used only when the platform setting is absent", () => {
  const config = loadFeeResolver({ CONSULTATION_FEE: "75", NODE_ENV: "production" });
  assert.equal(config.consultationFee(), "75");
});

test("missing both fee sources fails in production", () => {
  const config = loadFeeResolver({ NODE_ENV: "production" });
  assert.throws(() => config.consultationFee(), /not configured/);
});

test("an invalid existing database value fails instead of using the environment fallback", () => {
  const config = loadFeeResolver({ CONSULTATION_FEE: "50", NODE_ENV: "production" });
  assert.throws(() => config.consultationFee("not-a-fee"), /finite amount/);
});

test("fee validation preserves zero and enforces numeric(10,2) bounds", () => {
  const config = loadFeeResolver({});
  assert.equal(config.validateConsultationFee("0"), "0");
  assert.equal(config.validateConsultationFee("99999999.99"), "99999999.99");
  for (const invalid of ["-1", "1.001", "100000000", "NaN", "Infinity", "1e2", ""]) {
    assert.throws(() => config.validateConsultationFee(invalid));
  }
});

test("fee update is admin-guarded and validates the database setting server-side", async () => {
  const admin = await readFile(new URL("lib/actions/admin.ts", root), "utf8");
  const guard = admin.match(/async function getAdminSession\(\)[\s\S]*?\n}/)?.[0] ?? "";
  const update = admin.match(/export async function updatePlatformSetting\([\s\S]*?\n}/)?.[0] ?? "";
  assert.match(guard, /if \(!session\?\.user\) throw new Error\("Not authenticated"\)/);
  assert.match(guard, /assertAdminRole\(session\.user\.role\)/);
  assert.ok(update.indexOf("getAdminSession()") < update.indexOf("validateConsultationFee(value)"));
  assert.match(update, /setting\.key === "consultation_fee"\) validateConsultationFee\(value\)/);
});

test("only the exact admin role passes the server-side role assertion", async () => {
  const authSource = await readFile(new URL("lib/admin-authorization.ts", root), "utf8");
  const authorization = ts.transpileModule(authSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(authorization, { module, exports: module.exports });
  assert.equal(module.exports.assertAdminRole("admin"), undefined);
  for (const role of ["patient", "clinician", null, undefined]) {
    assert.throws(() => module.exports.assertAdminRole(role), /Forbidden/);
  }
});

test("consultation payment continues using the immutable consultation fee", async () => {
  const create = await readFile(new URL("lib/actions/consultations.ts", root), "utf8");
  const payment = await readFile(new URL("lib/actions/payments.ts", root), "utf8");
  const completion = await readFile(new URL("lib/payments/complete-consultation.ts", root), "utf8");
  assert.match(create, /\n\s+fee,\n/);
  assert.match(payment, /amount: fee,/);
  assert.match(payment, /amount: consultation\.fee,/);
  assert.match(completion, /Number\(consultation\.fee\) \* 100/);
  assert.match(completion, /amount: consultation\.fee/);
});
