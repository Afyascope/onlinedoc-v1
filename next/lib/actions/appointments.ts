"use server";

import { db } from "@/db";
import { appointments, user, clinicianProfiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { appUrl, sendEmail } from "@/lib/email/send";

export async function bookAppointment(data: {
  clinicianId: string;
  title: string;
  date: string;
  time: string;
  type: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { error: "Not authenticated" };

  const clinicianRows = await db
    .select({ id: user.id })
    .from(user)
    .leftJoin(clinicianProfiles, eq(clinicianProfiles.userId, user.id))
    .where(and(
      eq(user.id, data.clinicianId),
      eq(user.role, "clinician"),
      eq(user.clinicianStatus, "APPROVED"),
      eq(clinicianProfiles.isAcceptingPatients, true),
    ))
    .limit(1);
  if (clinicianRows.length === 0) return { error: "Clinician is not available" };

  const appointmentId = crypto.randomUUID();
  await db.insert(appointments).values({
    id: appointmentId,
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

  const clinician = (await db.select().from(user).where(eq(user.id, data.clinicianId)).limit(1))[0];
  await sendEmail({ to: session.user.email, subject: "Appointment booked", template: "consultation-reminder", props: { name: session.user.name, title: data.title, date: `${data.date} at ${data.time}`, url: appUrl("/dashboard/patient/appointments") } });
  if (clinician) await sendEmail({ to: clinician.email, subject: "New appointment booked", template: "consultation-reminder", props: { name: clinician.name, title: data.title, date: `${data.date} at ${data.time}`, url: appUrl("/dashboard/clinician/schedule") } });

  revalidatePath("/dashboard/patient/appointments");
  return { success: true };
}

export async function getAvailableClinicians() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return [];
  const clinicians = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(and(eq(user.role, "clinician"), eq(user.clinicianStatus, "APPROVED")));

  return clinicians;
}
