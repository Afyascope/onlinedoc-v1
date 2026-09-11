"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clinicianProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getClinicianStatus } from "@/lib/clinician-status";

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
  if (session.user.role !== "clinician" || getClinicianStatus(session.user) !== "APPROVED") return { error: "Clinician approval required" };

  const existing = await db
    .select()
    .from(clinicianProfiles)
    .where(eq(clinicianProfiles.userId, session.user.id))
    .limit(1);

  const values = {
    specialization: data.specialization,
    qualifications: data.qualifications,
    bio: data.bio,
    yearsOfExperience: data.yearsOfExperience,
    consultationFee: String(data.consultationFee),
    isAcceptingPatients: data.isAcceptingPatients,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db
      .update(clinicianProfiles)
      .set(values)
      .where(eq(clinicianProfiles.userId, session.user.id));
  } else {
    await db.insert(clinicianProfiles).values({
      userId: session.user.id,
      ...values,
      currency: "KES",
      createdAt: new Date(),
    });
  }

  revalidatePath("/dashboard/clinician/profile");
  return { success: true };
}
