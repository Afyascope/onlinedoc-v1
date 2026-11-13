import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { safeAuthRedirect } from "../lib/auth-redirect.mjs";

const root = new URL("../", import.meta.url);
const source = async (path) => readFile(new URL(path, root), "utf8");

test("auth redirect preserves the intended product URL", () => {
  assert.equal(
    safeAuthRedirect("/en/products/assessment-tool?ref=library"),
    "/en/products/assessment-tool?ref=library",
  );
  assert.equal(safeAuthRedirect("/sw/products/assessment-tool"), "/sw/products/assessment-tool");
});

test("auth redirect rejects external and malformed destinations", () => {
  for (const value of [
    "https://evil.example/steal",
    "//evil.example/steal",
    "/\\evil.example/steal",
    "javascript:alert(1)",
    "products/assessment-tool",
    "",
    null,
    undefined,
  ]) {
    assert.equal(safeAuthRedirect(value, "/dashboard/patient"), "/dashboard/patient");
  }
});

test("auth-required dialog uses the required copy and existing auth routes", async () => {
  const dialog = await source("components/auth/AuthRequiredDialog.tsx");

  assert.match(dialog, /title="Sign in required"/);
  assert.match(dialog, /message="Please sign in to download this product\."/);
  assert.match(dialog, /confirmLabel="Sign in"/);
  assert.match(dialog, /cancelLabel="Create account"/);
  assert.match(dialog, /\/login/);
  assert.match(dialog, /\/register/);
  assert.match(dialog, /redirect=\$\{encodeURIComponent\(redirectTo\)\}/);
});

test("purchase and download actions use the auth-required flow without alerts", async () => {
  const buy = await source("components/marketplace/BuyButton.tsx");
  const download = await source("components/marketplace/DownloadButton.tsx");

  assert.doesNotMatch(buy, /alert\(/);
  assert.match(buy, /requireAuth\(/);
  assert.match(buy, /AuthRequiredDialog/);
  assert.match(download, /requireAuth\(/);
  assert.match(download, /AuthRequiredDialog/);
});

test("order creation rejects unauthenticated requests before any order is written", async () => {
  const orders = await source("lib/actions/orders.ts");
  const unauth = orders.indexOf('code: "UNAUTHENTICATED"');
  const firstInsert = orders.indexOf("db.insert(orders)");

  assert.ok(unauth >= 0);
  assert.ok(firstInsert > unauth);
});

test("login, registration and email verification preserve the intended URL", async () => {
  const login = await source("components/auth/LoginForm.tsx");
  const register = await source("components/auth/RegisterForm.tsx");
  const auth = await source("context/auth-context.tsx");
  const verify = await source("app/[locale]/(auth)/verify-email/page.tsx");

  assert.match(login, /safeAuthRedirect\(requestedRedirect/);
  assert.match(register, /safeAuthRedirect\(searchParams\.get\("redirect"\)/);
  assert.match(auth, /callbackURL: redirectTo/);
  assert.match(verify, /searchParams\.get\("callbackURL"\)/);
  assert.match(verify, /safeAuthRedirect\(callbackURL/);
});
