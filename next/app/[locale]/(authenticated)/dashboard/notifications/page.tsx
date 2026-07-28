import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NotificationsListClient } from "./client";

export default function NotificationsPage() {
  return (
    <AuthGuard allowedRoles={["patient", "clinician", "admin"]}>
      <DashboardHeader title="Notifications" description="Stay updated on your consultations" />
      <DashboardShell>
        <NotificationsListClient />
      </DashboardShell>
    </AuthGuard>
  );
}
