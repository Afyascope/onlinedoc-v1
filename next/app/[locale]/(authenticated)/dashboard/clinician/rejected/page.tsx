import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function ClinicianRejectedPage() {
  return (
    <AuthGuard allowedRoles={["clinician"]} requiredClinicianStatus="REJECTED">
      <DashboardHeader title="Application not approved" description="Your clinician application status" />
      <DashboardShell>
        <div className="max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-8">
          <h1 className="text-2xl font-bold text-primary">Your application was not approved</h1>
          <p className="mt-3 text-neutral-700">
            Your clinician application was not approved at this time. Please contact support if you have questions or need more information.
          </p>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
