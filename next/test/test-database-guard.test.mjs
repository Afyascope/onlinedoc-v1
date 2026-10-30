import assert from "node:assert/strict";
import { test } from "node:test";
import { applyTestDatabaseEnvironment, resolveTestDatabaseUrl } from "../test-db/support.mjs";

const validLocal = "postgres://tester@127.0.0.1:55432/catalogue_auth_test";
const productionUrl = "postgresql://user:super-secret-password@ep-example.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";

test("a valid disposable local test database is accepted", () => {
  assert.equal(resolveTestDatabaseUrl("LOCAL_AUTH_TEST_DATABASE_URL", { LOCAL_AUTH_TEST_DATABASE_URL: validLocal }), validLocal);
  assert.equal(resolveTestDatabaseUrl("LOCAL_AUTH_TEST_DATABASE_URL", { LOCAL_AUTH_TEST_DATABASE_URL: "postgres://tester@localhost/test_db" }), "postgres://tester@localhost/test_db");
});

test("a missing dedicated test variable fails clearly and never falls back to DATABASE_URL", () => {
  assert.throws(
    () => resolveTestDatabaseUrl("LOCAL_AUTH_TEST_DATABASE_URL", { DATABASE_URL: productionUrl }),
    /LOCAL_AUTH_TEST_DATABASE_URL is required.*never used as a fallback/s,
  );
  assert.throws(
    () => applyTestDatabaseEnvironment("LOCAL_AUTH_TEST_DATABASE_URL", { DATABASE_URL: productionUrl }),
    /LOCAL_AUTH_TEST_DATABASE_URL is required/,
  );
});

test("production and non-local hosts are rejected", () => {
  assert.throws(
    () => resolveTestDatabaseUrl("LOCAL_AUTH_TEST_DATABASE_URL", { LOCAL_AUTH_TEST_DATABASE_URL: productionUrl }),
    (error) => {
      assert.match(error.message, /production-like host/);
      assert.doesNotMatch(error.message, /super-secret-password/);
      return true;
    },
  );
  assert.throws(
    () => resolveTestDatabaseUrl("LOCAL_AUTH_TEST_DATABASE_URL", { LOCAL_AUTH_TEST_DATABASE_URL: "postgres://tester@db.example.com/test_db" }),
    /must target localhost or 127\.0\.0\.1/,
  );
});

test("local databases without a test database name are rejected", () => {
  assert.throws(
    () => resolveTestDatabaseUrl("LOCAL_AUTH_TEST_DATABASE_URL", { LOCAL_AUTH_TEST_DATABASE_URL: "postgres://tester@127.0.0.1:55432/neondb" }),
    /must target a database whose name contains "test"/,
  );
});

test("invalid and non-postgres URLs are rejected without leaking credentials", () => {
  for (const value of ["not a url", "https://127.0.0.1:55432/catalogue_test", "postgres://"]) {
    assert.throws(
      () => resolveTestDatabaseUrl("LOCAL_AUTH_TEST_DATABASE_URL", { LOCAL_AUTH_TEST_DATABASE_URL: value }),
      (error) => {
        assert.ok(error instanceof Error);
        assert.doesNotMatch(error.message, /super-secret-password/);
        return true;
      },
    );
  }
});

test("the dedicated test URL replaces a production DATABASE_URL only after passing the guard", () => {
  const env = { DATABASE_URL: productionUrl, LOCAL_AUTH_TEST_DATABASE_URL: validLocal };
  assert.equal(applyTestDatabaseEnvironment("LOCAL_AUTH_TEST_DATABASE_URL", env), validLocal);
  assert.equal(env.DATABASE_URL, validLocal);
});
