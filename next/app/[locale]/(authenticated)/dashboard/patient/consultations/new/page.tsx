import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NewConsultationClient } from "./client";

export default function NewConsultationPage() {
  return (
    <AuthGuard allowedRoles={["patient"]}>
      <DashboardHeader
        title="New Consultation"
        description="Tell us about your medical concern"
      />
      <DashboardShell>
        <div className="max-w-2xl mx-auto">
          <NewConsultationClient />
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
