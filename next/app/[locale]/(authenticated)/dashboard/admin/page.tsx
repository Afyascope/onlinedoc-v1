import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell, MetricGrid, ContentGrid } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { IconUsers, IconStethoscope, IconClock, IconCalendarDue, IconUserCog, IconClipboardCheck, IconSettings, IconReport } from "@tabler/icons-react";

export default function AdminDashboard() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader
        title="Admin Dashboard"
        description="Manage the platform and users"
      />

      <DashboardShell>
        <MetricGrid>
          <MetricCard
            title="Total Users"
            value="0"
            description="Registered"
            icon={<IconUsers size={20} />}
          />
          <MetricCard
            title="Clinicians"
            value="0"
            description="Approved"
            icon={<IconStethoscope size={20} />}
          />
          <MetricCard
            title="Pending Approval"
            value="0"
            description="Clinicians awaiting review"
            icon={<IconClock size={20} />}
          />
          <MetricCard
            title="Appointments"
            value="0"
            description="This month"
            icon={<IconCalendarDue size={20} />}
          />
        </MetricGrid>

        <ContentGrid>
          <ActivityCard title="Clinician Approval Queue">
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8 text-neutral-400">
                <IconClipboardCheck size={32} stroke={1.5} />
              </div>
              <p className="text-center text-sm text-neutral-500 font-secondary">
                No clinicians awaiting approval.
              </p>
            </div>
          </ActivityCard>
          <ActivityCard title="Platform Overview">
            <div className="space-y-4">
              <OverviewRow label="Active Patients" value="0" />
              <OverviewRow label="Active Clinicians" value="0" />
              <OverviewRow label="Total Appointments" value="0" />
              <OverviewRow label="System Health" value="Operational" status="success" />
            </div>
          </ActivityCard>
        </ContentGrid>

        <QuickActionsCard
          actions={[
            { label: "Manage Users", icon: <IconUserCog size={18} /> },
            { label: "Review Clinicians", icon: <IconClipboardCheck size={18} /> },
            { label: "Platform Settings", icon: <IconSettings size={18} /> },
            { label: "View Reports", icon: <IconReport size={18} /> },
          ]}
        />
      </DashboardShell>
    </AuthGuard>
  );
}

function OverviewRow({ label, value, status }: { label: string; value: string; status?: "success" | "warning" | "error" }) {
  const statusColors = {
    success: "text-green-600",
    warning: "text-amber-600",
    error: "text-red-600",
  };

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-neutral-600 font-secondary">{label}</span>
      <span className={`text-sm font-medium ${status ? statusColors[status] : "text-primary"}`}>
        {value}
      </span>
    </div>
  );
}
