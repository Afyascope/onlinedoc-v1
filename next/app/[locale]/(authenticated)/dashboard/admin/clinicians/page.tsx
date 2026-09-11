import { getClinicians } from "@/lib/actions/admin";
import { AdminCliniciansClient } from "./client";

export default async function CliniciansPage() {
  const clinicians = await getClinicians();
  return <AdminCliniciansClient clinicians={clinicians} />;
}
