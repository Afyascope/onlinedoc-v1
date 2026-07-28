"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function updateProfileName(name: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { error: "Not authenticated" };

  await db
    .update(user)
    .set({ name, updatedAt: new Date() })
    .where(eq(user.id, session.user.id));

  return { success: true };
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { error: "Not authenticated" };

  const { error } = await auth.api.changePassword({
    body: { currentPassword, newPassword },
    headers: await headers(),
  });

  if (error) return { error: error.message || "Failed to change password" };
  return { success: true };
}
