import assert from "node:assert/strict";
import { test } from "node:test";
import { promoteVerifiedUser } from "../scripts/promote-admin.mjs";

function fakeTransaction(existingUser) {
  const updates = [];
  const transaction = async (callback) => callback({
    unsafe: async (query, params) => {
      if (query.startsWith("SELECT")) return existingUser ? [{ ...existingUser }] : [];
      updates.push(params);
      return [{ ...existingUser, role: "admin" }];
    },
  });
  return { transaction, updates };
}

for (const role of ["patient", "clinician"]) {
  test(`verified ${role} can be promoted without touching credentials`, async () => {
    const fake = fakeTransaction({ id: "user-1", email: "person@example.test", role, email_verified: true });
    const result = await promoteVerifiedUser(fake.transaction, "person@example.test");
    assert.deepEqual(result, { id: "user-1", email: "person@example.test", role: "admin", email_verified: true });
    assert.equal(fake.updates.length, 1);
    assert.deepEqual(fake.updates[0], ["admin", "user-1"]);
  });
}

for (const [label, user] of [
  ["nonexistent email", null],
  ["unverified email", { id: "user-2", email: "person@example.test", role: "patient", email_verified: false }],
  ["already-admin email", { id: "user-3", email: "person@example.test", role: "admin", email_verified: true }],
]) {
  test(`admin promotion refuses ${label} without changing the database`, async () => {
    const fake = fakeTransaction(user);
    await assert.rejects(promoteVerifiedUser(fake.transaction, "person@example.test"));
    assert.equal(fake.updates.length, 0);
  });
}

test("admin promotion requires an exact explicit email", async () => {
  const fake = fakeTransaction(null);
  await assert.rejects(promoteVerifiedUser(fake.transaction, " person@example.test"));
  assert.equal(fake.updates.length, 0);
});
