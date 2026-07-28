"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session;
}

export async function fetchNotifications(limit = 20) {
  const session = await getSession();

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return rows;
}

export async function getUnreadCount() {
  const session = await getSession();

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id));

  return rows.filter((n) => !n.readAt).length;
}

export async function markAsRead(notificationId: string) {
  const session = await getSession();

  await db.update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.id, notificationId));

  revalidatePath("/dashboard");
  return { success: true };
}

export async function markAllAsRead() {
  const session = await getSession();

  await db.update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.userId, session.user.id));

  revalidatePath("/dashboard");
  return { success: true };
}
