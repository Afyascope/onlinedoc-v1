import { db } from "@/db";
import { consultations, appointments } from "@/db/schema";
import { eq, and, gte, lte, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id;
}

export async function getClinicianOverview() {
  const userId = await getUserId();
  if (!userId) return { totalPatients: 0, todayConsultations: 0, awaitingClinician: 0, completedConsultations: 0, recentConsultations: [], appointments: [] };

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split("T")[0];
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().split("T")[0];
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const [patCount] = await db
    .select({ count: count() })
    .from(appointments)
    .where(eq(appointments.clinicianId, userId));

  const [todayCount] = await db
    .select({ count: count() })
    .from(consultations)
    .where(and(
      eq(consultations.clinicianId, userId),
      gte(consultations.updatedAt, startOfDay),
      lte(consultations.updatedAt, endOfDay)
    ));

  const [awaitingCount] = await db
    .select({ count: count() })
    .from(consultations)
    .where(and(
      eq(consultations.clinicianId, userId),
      eq(consultations.status, "waiting_for_clinician")
    ));

  const [completedCount] = await db
    .select({ count: count() })
    .from(consultations)
    .where(and(
      eq(consultations.clinicianId, userId),
      eq(consultations.status, "completed"),
      gte(consultations.updatedAt, startOfMonth)
    ));

  const recent = await db
    .select()
    .from(consultations)
    .where(eq(consultations.clinicianId, userId))
    .orderBy(consultations.updatedAt)
    .limit(5);

  const apts = await db
    .select()
    .from(appointments)
    .where(and(
      eq(appointments.clinicianId, userId),
      gte(appointments.date, startOfDay)
    ))
    .orderBy(appointments.date)
    .limit(5);

  return {
    totalPatients: patCount?.count ?? 0,
    todayConsultations: todayCount?.count ?? 0,
    awaitingClinician: awaitingCount?.count ?? 0,
    completedConsultations: completedCount?.count ?? 0,
    recentConsultations: recent,
    appointments: apts,
  };
}
