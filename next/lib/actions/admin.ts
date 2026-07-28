"use server";

import { db } from "@/db";
import { user, settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function approveClinician(userId: string) {
  await db
    .update(user)
    .set({ clinicianApproved: true, updatedAt: new Date() })
    .where(eq(user.id, userId));

  return { success: true };
}

export async function rejectClinician(userId: string) {
  await db
    .update(user)
    .set({ clinicianApproved: false, updatedAt: new Date() })
    .where(eq(user.id, userId));

  return { success: true };
}

export async function upsertSetting({
  id,
  key,
  value,
  type,
  description,
}: {
  id?: string;
  key: string;
  value: string;
  type: string;
  description: string;
}) {
  const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);

  if (existing.length > 0) {
    await db
      .update(settings)
      .set({ value, type, description, updatedAt: new Date() })
      .where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({
      id: crypto.randomUUID(),
      key,
      value,
      type,
      description,
      updatedAt: new Date(),
    });
  }

  return { success: true };
}
