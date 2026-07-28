import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { ClinicianApprovalBanner } from "@/components/auth/ClinicianApprovalBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <EmailVerificationBanner />
      <ClinicianApprovalBanner />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
