import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function ClinicianPendingPage() {
  return (
    <AuthGuard allowedRoles={["clinician"]} requiredClinicianStatus="PENDING">
      <DashboardHeader title="Application under review" description="Your clinician application is being reviewed" />
      <DashboardShell>
        <div className="max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-8">
          <h1 className="text-2xl font-bold text-primary">Your application is under review</h1>
          <p className="mt-3 text-neutral-700">
            Thank you for applying to join OnlineDoc as a clinician. An administrator is reviewing your application.
            You will receive an email once your account has been approved.
          </p>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
