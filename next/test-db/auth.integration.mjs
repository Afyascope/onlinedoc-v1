import assert from "node:assert/strict";
import crypto from "node:crypto";
import { after, before, test } from "node:test";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { applyMigrations, applyTestDatabaseEnvironment, resetTestSchema } from "./support.mjs";

const databaseUrl = applyTestDatabaseEnvironment("LOCAL_AUTH_TEST_DATABASE_URL");

process.env.NODE_ENV = "test";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
process.env.BETTER_AUTH_SECRET = crypto.randomBytes(32).toString("hex");
process.env.EMAIL_PROVIDER = "mock";
process.env.EMAIL_FROM_ADDRESS = "no-reply@example.test";
process.env.EMAIL_REPLY_TO = "support@example.test";

const baseUrl = "http://localhost:3000";

let sql;
let auth;
let db;
let schema;
let fixture;

function authRequest(path, init) {
  return auth.handler(new Request(`${baseUrl}/api/auth${path}`, init));
}

function signIn(email, password) {
  return authRequest("/sign-in/email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: baseUrl,
    },
    body: JSON.stringify({ email, password }),
  });
}

function responseCookie(response) {
  const values = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")].filter(Boolean);
  return values.map((value) => value.split(";")[0]).join("; ");
}

before(async () => {
  sql = postgres(databaseUrl, { ssl: "require", max: 1, connect_timeout: 10 });
  await resetTestSchema(sql);
  await applyMigrations(sql);

  auth = (await import("../lib/auth.ts")).auth;
  db = (await import("../db/index.ts")).db;
  schema = await import("../db/schema.ts");
  fixture = await import("./fixtures/local-auth-users.mjs");
  await fixture.provisionLocalAuthUsers(db);
});

after(async () => {
  if (db?.$client) await db.$client.end({ timeout: 1 }).catch(() => undefined);
  if (sql) await sql.end({ timeout: 1 }).catch(() => undefined);
});

test("the dedicated test database is local and never comes from DATABASE_URL", () => {
  const target = new URL(process.env.DATABASE_URL);
  assert.equal(target.hostname, "127.0.0.1");
  assert.match(target.pathname, /test/i);
});

test("clinician@example.test authenticates and establishes a clinician session", async () => {
  const response = await signIn("clinician@example.test", fixture.LOCAL_AUTH_TEST_PASSWORD);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.user.email, "clinician@example.test");
  assert.equal(body.user.role, "clinician");
  assert.equal(body.user.emailVerified, true);

  const cookies = responseCookie(response);
  assert.match(cookies, /session_token=/);
  const sessionResponse = await authRequest("/get-session", { headers: { cookie: cookies } });
  assert.equal(sessionResponse.status, 200);
  const session = await sessionResponse.json();
  assert.equal(session.user.email, "clinician@example.test");
  assert.equal(session.user.role, "clinician");
});

test("incorrect credentials and unknown users are still rejected", async () => {
  const wrongPassword = await signIn("clinician@example.test", "DefinitelyWrong!2026");
  assert.equal(wrongPassword.status, 401);
  assert.equal(responseCookie(wrongPassword), "");

  const unknownUser = await signIn("nobody@example.test", fixture.LOCAL_AUTH_TEST_PASSWORD);
  assert.equal(unknownUser.status, 401);
  assert.equal(responseCookie(unknownUser), "");
});

test("normal credential users outside the fixture still authenticate normally", async () => {
  const { hashPassword } = await import("better-auth/crypto");
  const password = "RegularUser!2026";
  const userId = crypto.randomUUID();
  const now = new Date();
  await db.insert(schema.user).values({
    id: userId,
    name: "Regular Test User",
    email: "regular-user@example.test",
    emailVerified: true,
    role: "patient",
    clinicianApproved: false,
    clinicianStatus: "PENDING",
    banned: false,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(schema.account).values({
    id: crypto.randomUUID(),
    userId,
    accountId: userId,
    providerId: "credential",
    password: await hashPassword(password),
    createdAt: now,
    updatedAt: now,
  });

  const response = await signIn("regular-user@example.test", password);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.user.role, "patient");
  assert.equal(body.user.email, "regular-user@example.test");
});

test("the stored credential uses Better Auth hashing and verifies the fixture password", async () => {
  const { verifyPassword } = await import("better-auth/crypto");
  const [clinician] = await db
    .select({ id: schema.user.id, role: schema.user.role })
    .from(schema.user)
    .where(eq(schema.user.email, "clinician@example.test"))
    .limit(1);
  assert.ok(clinician);
  assert.equal(clinician.role, "clinician");

  const [credential] = await db
    .select({ password: schema.account.password })
    .from(schema.account)
    .where(eq(schema.account.userId, clinician.id))
    .limit(1);
  assert.ok(credential?.password);
  assert.notEqual(credential.password, fixture.LOCAL_AUTH_TEST_PASSWORD);
  assert.equal(await verifyPassword({ hash: credential.password, password: fixture.LOCAL_AUTH_TEST_PASSWORD }), true);
});
