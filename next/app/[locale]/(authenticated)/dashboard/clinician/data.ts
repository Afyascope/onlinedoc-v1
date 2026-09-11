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
  const startOfDayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateStr = startOfDayDate.toISOString().split("T")[0];

  const [patCount] = await db
    .select({ count: count() })
    .from(appointments)
    .where(eq(appointments.clinicianId, userId));

  const [todayCount] = await db
    .select({ count: count() })
    .from(consultations)
    .where(and(
      eq(consultations.clinicianId, userId),
      gte(consultations.updatedAt, startOfDayDate),
      lte(consultations.updatedAt, endOfDayDate)
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
      gte(consultations.updatedAt, startOfMonthDate)
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
      gte(appointments.date, dateStr)
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
