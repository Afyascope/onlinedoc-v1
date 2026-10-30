import { auth } from "@/lib/auth";
import { db } from "@/db";
import { prescriptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { PatientPrescriptionsClient } from "./client";

export default async function PrescriptionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const list = userId
    ? await db.select({
        id: prescriptions.id,
        medication: prescriptions.medication,
        dosage: prescriptions.dosage,
        dosageForm: prescriptions.dosageForm,
        frequency: prescriptions.frequency,
        duration: prescriptions.duration,
        route: prescriptions.route,
        instructions: prescriptions.instructions,
        strengthSnapshot: prescriptions.strengthSnapshot,
        startDate: prescriptions.startDate,
        endDate: prescriptions.endDate,
        status: prescriptions.status,
        refillsRemaining: prescriptions.refillsRemaining,
        refillsTotal: prescriptions.refillsTotal,
      }).from(prescriptions).where(eq(prescriptions.patientId, userId)).orderBy(desc(prescriptions.startDate))
    : [];

  return <PatientPrescriptionsClient prescriptions={list} />;
}
