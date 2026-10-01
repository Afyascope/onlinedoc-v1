import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isAdminPath, stripLocalePrefix } from "../lib/admin-route-path.mjs";

test("localized admin root and nested routes stay inside the admin route", () => {
  const routes = [
    "",
    "/users",
    "/clinicians",
    "/consultations",
    "/products",
    "/orders",
    "/payments",
    "/content",
    "/notifications",
    "/reports",
    "/analytics",
    "/audit-logs",
    "/settings",
  ];

  for (const locale of ["en", "fr"]) {
    for (const route of routes) {
      assert.equal(isAdminPath(`/${locale}/dashboard/admin${route}`), true);
      assert.equal(
        stripLocalePrefix(`/${locale}/dashboard/admin${route}`),
        `/dashboard/admin${route}`,
      );
    }
  }
});

test("admin route matching rejects paths outside the admin dashboard", () => {
  for (const path of [
    "/en/dashboard/patient",
    "/en/dashboard/clinician",
    "/en/dashboard/administrator",
    "/fr/dashboard/administer",
    "/dashboard/patient",
  ]) {
    assert.equal(isAdminPath(path), false, path);
  }
});

test("admin layout enforces the server session role and keeps redirects localized", async () => {
  const layout = await readFile(
    new URL("../app/[locale]/(authenticated)/dashboard/admin/layout.tsx", import.meta.url),
    "utf8",
  );
  const guard = await readFile(
    new URL("../components/auth/AuthGuard.tsx", import.meta.url),
    "utf8",
  );
  assert.match(layout, /auth\.api\.getSession\(\{ headers: await headers\(\) \}\)/);
  assert.match(layout, /session\?\.user\.role !== "admin"/);
  assert.match(layout, /redirect\(`\/\$\{params\.locale\}\$\{dashboardPath\}`\)/);
  assert.match(guard, /role === "admin" && !isAdminPath\(path\)/);
});
