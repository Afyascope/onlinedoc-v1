import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { loadTsModule } from "./helpers/load-ts.mjs";

const root = new URL("../", import.meta.url);
const errors = loadTsModule(new URL("lib/db/errors.ts", root));
const network = loadTsModule(new URL("lib/db/network.ts", root));
const source = (path) => readFile(new URL(path, root), "utf8");

test("connection failures are sanitized and keep only useful error codes", () => {
  const aggregate = new AggregateError([
    Object.assign(new Error("connect ETIMEDOUT 203.0.113.10:5432"), { code: "ETIMEDOUT" }),
    Object.assign(new Error("connect ENETUNREACH 2001:db8::1:5432"), { code: "ENETUNREACH" }),
  ], "connect ETIMEDOUT");
  aggregate.code = "ETIMEDOUT";

  const safe = errors.sanitizeDatabaseError(aggregate);
  assert.equal(safe.code, "ETIMEDOUT");
  assert.ok(safe.codes.includes("ENETUNREACH"));
  assert.equal(safe.message, "Database connection failed or timed out.");
  assert.doesNotMatch(JSON.stringify(safe), /203\.0\.113\.10|2001:db8|postgres(ql)?:\/\//);
});

test("database errors never expose the original connection message", () => {
  const error = new Error(
    "password authentication failed for user secret-user at postgresql://secret-user:secret-password@db.example/neondb",
  );
  const safe = errors.sanitizeDatabaseError(error);
  assert.equal(safe.message, "Database operation failed.");
  assert.doesNotMatch(JSON.stringify(safe), /secret-user|secret-password|db\.example|postgresql:\/\//);
});

test("the configured database target is described without returning the URL", () => {
  const summary = errors.describeDatabaseTarget(
    "postgresql://secret-user:secret-password@ep-example.neon.tech/neondb?sslmode=require",
  );
  assert.equal(summary.host, "ep-example.neon.tech");
  assert.equal(summary.database, "neondb");
  assert.equal(summary.passwordPresent, true);
  assert.doesNotMatch(JSON.stringify(summary), /secret-user|secret-password|postgresql:\/\//);
  assert.equal(errors.describeDatabaseTarget(undefined).present, false);
});

test("Node happy-eyeballs networking gets a longer attempt timeout for Neon", () => {
  const configured = network.configureDatabaseNetworking();
  assert.equal(configured.autoSelectFamilyAttemptTimeoutMs, 1000);
});

test("database initialization applies the networking fix and logs sanitized diagnostics", async () => {
  const db = await source("db/index.ts");
  assert.match(db, /configureDatabaseNetworking/);
  assert.match(db, /describeDatabaseTarget\(process\.env\.DATABASE_URL\)/);
  assert.match(db, /sanitizeDatabaseError\(error\)/);
  assert.match(db, /connect_timeout: 10/);
  assert.doesNotMatch(db, /url\.toString\(\)/);
});

test("health checks report failures without leaking driver messages", async () => {
  const health = await source("app/api/health/route.ts");
  assert.match(health, /sanitizeDatabaseError\(error\)/);
  assert.doesNotMatch(health, /e\?\.message|error\.message/);
});

test("a database failure cannot bypass authentication or search authorization", async () => {
  const route = await source("app/api/catalogue/search/route.ts");
  const action = await source("lib/actions/catalogue.ts");
  const admin = await source("lib/actions/catalogue-admin.ts");

  const routeAuth = route.indexOf("auth.api.getSession");
  const routeSearch = route.indexOf("searchActiveCatalogue(domain");
  assert.ok(routeAuth >= 0 && routeSearch >= 0 && routeAuth < routeSearch);

  const actionAuth = action.indexOf("auth.api.getSession");
  const actionSearch = action.indexOf("searchActiveCatalogue(domain");
  assert.ok(actionAuth >= 0 && actionSearch >= 0 && actionAuth < actionSearch);
  assert.match(route, /sanitizeDatabaseError\(error\)/);
  assert.match(route, /status: 401/);
  assert.match(route, /status: 403/);
  assert.match(route, /status: 503/);
  assert.match(action, /Not authenticated/);
  assert.match(action, /Forbidden/);
  assert.match(admin, /assertAdminRole\(session\.user\.role\)/);
});
