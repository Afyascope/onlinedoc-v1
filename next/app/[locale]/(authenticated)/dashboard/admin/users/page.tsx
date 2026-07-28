import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { desc } from "drizzle-orm";
import { headers } from "next/headers";
import { AdminUsersClient } from "./client";

export default async function UsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return <AdminUsersClient users={[]} />;

  const allUsers = await db.select().from(user).orderBy(desc(user.createdAt));
  return <AdminUsersClient users={allUsers} />;
}
