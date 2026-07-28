import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, appointments } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { ClinicianPatientsClient } from "./client";

export default async function PatientsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  let patientsList: { id: string; name: string; email: string; createdAt: Date }[] = [];

  if (userId) {
    const patientIds = await db
      .select({ id: appointments.patientId })
      .from(appointments)
      .where(eq(appointments.clinicianId, userId));

    const ids = [...new Set(patientIds.map((p) => p.id).filter(Boolean))];

    if (ids.length > 0) {
      patientsList = await db
        .select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt })
        .from(user)
        .where(inArray(user.id, ids));
    }
  }

  return <ClinicianPatientsClient patients={patientsList} />;
}
