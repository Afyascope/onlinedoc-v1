import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { account, user } from "../../db/schema.ts";

export const LOCAL_AUTH_TEST_PASSWORD = "LocalTestOnly!2026";

export const LOCAL_AUTH_TEST_USERS = Object.freeze([
  {
    email: "admin@example.test",
    name: "Local Test Admin",
    role: "admin",
    clinicianApproved: true,
    clinicianStatus: "APPROVED",
  },
  {
    email: "clinician@example.test",
    name: "Local Test Clinician",
    role: "clinician",
    clinicianApproved: true,
    clinicianStatus: "APPROVED",
  },
  {
    email: "patient@example.test",
    name: "Local Test Patient",
    role: "patient",
    clinicianApproved: false,
    clinicianStatus: "PENDING",
  },
]);

/**
 * Provision deterministic synthetic users in a guarded test database.
 *
 * The password is hashed with Better Auth's own production password hasher,
 * and credential accounts are recreated/updated so stale hashes cannot cause
 * "Invalid credentials". This function must only receive a database selected
 * through resolveTestDatabaseUrl.
 */
export async function provisionLocalAuthUsers(db) {
  const passwordHash = await hashPassword(LOCAL_AUTH_TEST_PASSWORD);
  const now = new Date();
  const provisioned = [];

  for (const fixture of LOCAL_AUTH_TEST_USERS) {
    const existing = await db.select().from(user).where(eq(user.email, fixture.email)).limit(1);
    let userId = existing[0]?.id;

    if (userId) {
      await db
        .update(user)
        .set({
          name: fixture.name,
          emailVerified: true,
          role: fixture.role,
          clinicianApproved: fixture.clinicianApproved,
          clinicianStatus: fixture.clinicianStatus,
          banned: false,
          updatedAt: now,
        })
        .where(eq(user.id, userId));
    } else {
      userId = crypto.randomUUID();
      await db.insert(user).values({
        id: userId,
        name: fixture.name,
        email: fixture.email,
        emailVerified: true,
        role: fixture.role,
        clinicianApproved: fixture.clinicianApproved,
        clinicianStatus: fixture.clinicianStatus,
        banned: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    const credential = await db
      .select()
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
      .limit(1);

    if (credential[0]) {
      await db
        .update(account)
        .set({ password: passwordHash, updatedAt: now })
        .where(eq(account.id, credential[0].id));
    } else {
      await db.insert(account).values({
        id: crypto.randomUUID(),
        userId,
        accountId: userId,
        providerId: "credential",
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      });
    }

    provisioned.push({ email: fixture.email, role: fixture.role, id: userId });
  }

  return provisioned;
}
