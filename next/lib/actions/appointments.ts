"use server";

import { db } from "@/db";
import { appointments, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import crypto from "crypto";

export async function bookAppointment(data: {
  clinicianId: string;
  title: string;
  date: string;
  time: string;
  type: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { error: "Not authenticated" };

  await db.insert(appointments).values({
    id: crypto.randomUUID(),
    patientId: session.user.id,
    clinicianId: data.clinicianId,
    title: data.title,
    date: data.date,
    time: data.time,
    type: data.type,
    status: "scheduled",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { success: true };
}

export async function getAvailableClinicians() {
  const clinicians = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.role, "clinician"));

  return clinicians;
}
