import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clinicianProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { ClinicianProfileClient } from "./client";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  const userId = user?.id;

  let profile = null;
  if (userId) {
    const rows = await db.select().from(clinicianProfiles).where(eq(clinicianProfiles.userId, userId)).limit(1);
    profile = rows[0] ?? null;
  }

  return <ClinicianProfileClient user={user ? { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified, clinicianApproved: user.clinicianApproved } : null} profile={profile} />;
}
