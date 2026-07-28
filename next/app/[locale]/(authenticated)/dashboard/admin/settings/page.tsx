import { auth } from "@/lib/auth";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { headers } from "next/headers";
import { AdminSettingsClient } from "./client";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return <AdminSettingsClient settings={[]} />;

  const allSettings = await db.select().from(settings);
  return <AdminSettingsClient settings={allSettings} />;
}
