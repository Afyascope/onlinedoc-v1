import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell, MetricGrid, ContentGrid } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import {
  IconUsers, IconStethoscope, IconMessageChatbot, IconCurrencyDollar,
  IconShoppingCart, IconDownload, IconClock, IconCheck,
  IconUserCog, IconClipboardCheck, IconSettings, IconReport,
  IconActivity, IconCalendarDue,
} from "@tabler/icons-react";
import { getAdminMetrics } from "@/lib/actions/admin";

export default async function AdminDashboard() {
  const metrics = await getAdminMetrics();

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader
        title="Admin Dashboard"
        description="Manage the platform and users"
      />

      <DashboardShell>
        <MetricGrid>
          <MetricCard title="Total Users" value={metrics.totalUsers.toLocaleString()} description="All registered" icon={<IconUsers size={20} />} />
          <MetricCard title="Patients" value={metrics.totalPatients.toLocaleString()} description="Patient accounts" icon={<IconUsers size={20} />} />
          <MetricCard title="Clinicians" value={metrics.totalClinicians.toLocaleString()} description="Registered" icon={<IconStethoscope size={20} />} />
          <MetricCard title="Pending Approval" value={metrics.pendingClinicians.toLocaleString()} description="Clinicians awaiting review" icon={<IconClock size={20} />} />
          <MetricCard title="Active Consultations" value={metrics.activeConsultations.toLocaleString()} description="In progress" icon={<IconMessageChatbot size={20} />} />
          <MetricCard title="Today&apos;s Consultations" value={metrics.todayConsultations.toLocaleString()} description="Started today" icon={<IconCalendarDue size={20} />} />
          <MetricCard title="Completed" value={metrics.completedConsultations.toLocaleString()} description="All time" icon={<IconCheck size={20} />} />
          <MetricCard title="Total Revenue" value={`KES ${metrics.totalRevenue.toLocaleString()}`} description="From paid orders" icon={<IconCurrencyDollar size={20} />} />
          <MetricCard title="Products Sold" value={metrics.productsSold.toLocaleString()} description="Items ordered" icon={<IconShoppingCart size={20} />} />
          <MetricCard title="Downloads" value={metrics.totalDownloads.toLocaleString()} description="Digital products" icon={<IconDownload size={20} />} />
          <MetricCard title="Active Sessions" value={metrics.activeSessions.toLocaleString()} description="Right now" icon={<IconActivity size={20} />} />
          <MetricCard title="Total Consultations" value={metrics.totalConsultations.toLocaleString()} description={`${metrics.completedConsultations} completed`} icon={<IconMessageChatbot size={20} />} />
        </MetricGrid>

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
