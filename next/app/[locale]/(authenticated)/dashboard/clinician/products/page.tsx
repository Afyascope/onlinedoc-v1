import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconPackage } from "@tabler/icons-react";
import { requireApprovedClinician } from "@/lib/clinician-access";

export default async function ClinicianProductsPage() {
  await requireApprovedClinician();

  return (
    <AuthGuard allowedRoles={["clinician"]}>
      <DashboardHeader
        title="My Products"
        description="Your digital health products"
      />
      <DashboardShell>
        <ActivityCard title="Product Management">
          <EmptyState
            icon={<IconPackage size={24} />}
            title="Products are managed by administrators"
            description="Digital health products are created, edited, and published by administrators in Strapi. Contact support if you would like to publish a product."
          />
        </ActivityCard>
      </DashboardShell>
    </AuthGuard>
  );
}
