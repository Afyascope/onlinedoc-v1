import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("production authentication does not special-case synthetic test accounts", async () => {
  const authSource = await source("lib/auth.ts");
  const contextSource = await source("context/auth-context.tsx");
  const clientSource = await source("lib/auth-client.ts");

  assert.doesNotMatch(authSource, /example\.test|LocalTestOnly/);
  assert.doesNotMatch(contextSource, /example\.test|LocalTestOnly/);
  assert.match(clientSource, /createAuthClient/);
  assert.match(contextSource, /authClient\.signIn\.email/);

  assert.match(authSource, /emailAndPassword:\s*\{[\s\S]*enabled:\s*true/);
  assert.match(authSource, /requireEmailVerification:\s*true/);
  assert.doesNotMatch(authSource, /disableSignUp|bypass|skipPassword|plaintextPassword/i);
});

test("the synthetic auth fixture uses Better Auth hashing and the expected accounts", async () => {
  const fixture = await source("test-db/fixtures/local-auth-users.mjs");

  assert.match(fixture, /import \{ hashPassword \} from "better-auth\/crypto"/);
  assert.match(fixture, /email: "clinician@example\.test"/);
  assert.match(fixture, /email: "patient@example\.test"/);
  assert.match(fixture, /email: "admin@example\.test"/);
  assert.match(fixture, /role: "clinician"/);
  assert.match(fixture, /providerId: "credential"/);
  assert.doesNotMatch(fixture, /verifyPassword\s*=\s*async\s*\(\s*\)\s*=>\s*true/);
});

test("the fixture and database tests require an explicit guarded test database", async () => {
  const seedSource = await source("scripts/seed-local-auth.mjs");
  const catalogueTest = await source("test-db/catalogue-db.integration.mjs");
  const authTest = await source("test-db/auth.integration.mjs");

  assert.match(seedSource, /LOCAL_AUTH_TEST_DATABASE_URL/);
  assert.match(authTest, /LOCAL_AUTH_TEST_DATABASE_URL/);
  assert.match(catalogueTest, /CATALOGUE_TEST_DATABASE_URL/);
  for (const sourceText of [seedSource, catalogueTest, authTest]) {
    assert.doesNotMatch(sourceText, /process\.env\.DATABASE_URL\s*\|\|/);
    assert.doesNotMatch(sourceText, /process\.env\.DATABASE_URL\s*\?\?/);
  }
});

test("local development does not override the shared database with a test database", async () => {
  let developmentEnv = "";
  try {
    developmentEnv = await source(".env.development");
  } catch {
    return;
  }

  assert.doesNotMatch(
    developmentEnv,
    /^\s*DATABASE_URL\s*=/m,
    ".env.development must not override DATABASE_URL; local development uses the existing .env connection and tests use dedicated guarded URLs.",
  );
});
