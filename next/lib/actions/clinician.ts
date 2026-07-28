"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clinicianProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function updateClinicianProfile(data: {
  specialization: string;
  qualifications: string;
  bio: string;
  yearsOfExperience: number;
  consultationFee: number;
  isAcceptingPatients: boolean;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { error: "Not authenticated" };

  const existing = await db
    .select()
    .from(clinicianProfiles)
    .where(eq(clinicianProfiles.userId, session.user.id))
    .limit(1);

  const profile = {
    ...data,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db
      .update(clinicianProfiles)
      .set(profile)
      .where(eq(clinicianProfiles.userId, session.user.id));
  } else {
    await db.insert(clinicianProfiles).values({
      userId: session.user.id,
      currency: "USD",
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return { success: true };
}
