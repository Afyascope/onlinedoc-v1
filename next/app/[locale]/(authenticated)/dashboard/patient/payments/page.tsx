import { auth } from "@/lib/auth";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { PatientPaymentsClient } from "./client";

export default async function PaymentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const list = userId
    ? await db.select().from(payments).where(eq(payments.patientId, userId)).orderBy(desc(payments.createdAt))
    : [];

  return <PatientPaymentsClient payments={list} />;
}
