import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, clinicianProfiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { AdminCliniciansClient } from "./client";

export default async function CliniciansPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return <AdminCliniciansClient clinicians={[]} />;

  const clinicians = await db
    .select()
    .from(user)
    .where(eq(user.role, "clinician"))
    .orderBy(desc(user.createdAt));

  const profileRows = await db.select().from(clinicianProfiles);
  const profileMap = new Map(profileRows.map((p) => [p.userId, p]));

  const enriched = clinicians.map((c) => ({
    ...c,
    profile: profileMap.get(c.id) ?? null,
  }));

  return <AdminCliniciansClient clinicians={enriched} />;
}
