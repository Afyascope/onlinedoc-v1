import type { ClinicianStatus } from "@/types/auth";

export function getClinicianStatus(user: { clinicianStatus?: string | null; clinicianApproved?: boolean | null }): ClinicianStatus {
  if (user.clinicianStatus === "REJECTED") return "REJECTED";
  if (user.clinicianStatus === "SUSPENDED") return "SUSPENDED";
  if (user.clinicianStatus === "APPROVED" || user.clinicianApproved === true) return "APPROVED";
  return "PENDING";
}

export function getDashboardPath(user: { role?: string; clinicianStatus?: string | null; clinicianApproved?: boolean | null }): string {
  if (user.role === "admin") return "/dashboard/admin";
  if (user.role === "clinician") {
    const status = getClinicianStatus(user);
    if (status === "REJECTED") return "/dashboard/clinician/rejected";
    if (status === "PENDING") return "/dashboard/clinician/pending";
    if (status === "SUSPENDED") return "/login?error=suspended";
    return "/dashboard/clinician";
  }
  return "/dashboard/patient";
}
