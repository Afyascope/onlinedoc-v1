import { auth } from "@/lib/auth";
import { db } from "@/db";
import { consultations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { PaymentGateClient } from "./client";

export default async function PaymentPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const rows = userId
    ? await db.select().from(consultations).where(eq(consultations.id, params.id)).limit(1)
    : [];

  if (rows.length === 0 || rows[0].patientId !== userId) {
    return <div className="p-8 text-center text-neutral-500">Consultation not found.</div>;
  }

  return <PaymentGateClient consultation={rows[0]} />;
}
