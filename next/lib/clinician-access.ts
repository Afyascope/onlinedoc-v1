import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getClinicianStatus } from "@/lib/clinician-status";

export async function requireApprovedClinician() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if (session.user.role !== "clinician") redirect("/dashboard/patient");

  const status = getClinicianStatus(session.user);
  if (status === "PENDING") redirect("/dashboard/clinician/pending");
  if (status === "REJECTED") redirect("/dashboard/clinician/rejected");
  if (status === "SUSPENDED") redirect("/login?error=suspended");

  return session;
}
