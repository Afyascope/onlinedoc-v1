import test from "node:test";
import assert from "node:assert/strict";
import { isPublicRegistrationRole } from "../lib/public-registration-role.mjs";

test("patient registration role is accepted", () => {
  assert.equal(isPublicRegistrationRole("patient"), true);
});

test("clinician registration role is accepted", () => {
  assert.equal(isPublicRegistrationRole("clinician"), true);
});

test("admin and invalid registration roles are rejected", () => {
  for (const role of ["admin", "", "doctor", null, undefined, 1]) {
    assert.equal(isPublicRegistrationRole(role), false);
  }
});
