import { db } from "@/db";
import { consultations, appointments, prescriptions, medicalRecords } from "@/db/schema";
import { eq, and, gte, lte, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id;
}

export async function getPatientOverview() {
  const userId = await getUserId();
  if (!userId) return { activeConsultations: 0, upcomingAppointments: 0, prescriptions: 0, medicalRecords: 0, recentConsultations: [], appointments: [] };

  const now = new Date();
  const thirtyDaysDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const startOfDayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStr = startOfDayDate.toISOString().split("T")[0];
  const thirtyDaysStr = thirtyDaysDate.toISOString().split("T")[0];

  const [activeCons] = await db
    .select({ count: count() })
    .from(consultations)
    .where(and(
      eq(consultations.patientId, userId),
      eq(consultations.status, "in_consultation")
    ));
  const [upcomingApts] = await db
    .select({ count: count() })
    .from(appointments)
    .where(and(
      eq(appointments.patientId, userId),
      gte(appointments.date, dateStr),
      lte(appointments.date, thirtyDaysStr)
    ));
  const [rxCount] = await db
    .select({ count: count() })
    .from(prescriptions)
    .where(and(
      eq(prescriptions.patientId, userId),
      eq(prescriptions.status, "active")
    ));
  const [recCount] = await db
    .select({ count: count() })
    .from(medicalRecords)
    .where(eq(medicalRecords.patientId, userId));

  const recent = await db
    .select()
    .from(consultations)
    .where(eq(consultations.patientId, userId))
    .orderBy(consultations.createdAt)
    .limit(5);

  const apts = await db
    .select()
    .from(appointments)
    .where(and(
      eq(appointments.patientId, userId),
      gte(appointments.date, dateStr)
    ))
    .orderBy(appointments.date)
    .limit(5);

  return {
    activeConsultations: activeCons?.count ?? 0,
    upcomingAppointments: upcomingApts?.count ?? 0,
    prescriptions: rxCount?.count ?? 0,
    medicalRecords: recCount?.count ?? 0,
    recentConsultations: recent,
    appointments: apts,
  };
}
