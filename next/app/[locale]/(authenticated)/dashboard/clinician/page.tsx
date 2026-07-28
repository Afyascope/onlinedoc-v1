import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell, MetricGrid, ContentGrid } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { ClinicianConsultationsList } from "./consultations-list";
import { getClinicianOverview } from "./data";
import { IconUsers, IconCalendarDue, IconClipboardCheck, IconMessage, IconCalendarPlus, IconList, IconStethoscope, IconUserEdit, IconMessageChatbot } from "@tabler/icons-react";

export default async function ClinicianDashboard() {
  const data = await getClinicianOverview();

  return (
    <AuthGuard allowedRoles={["clinician"]}>
      <DashboardHeader
        title="Clinician Dashboard"
        description="Manage your patients and consultations"
      />

      <DashboardShell>
        <MetricGrid>
          <MetricCard
            title="Total Patients"
            value={String(data.totalPatients)}
            description="Under your care"
            icon={<IconUsers size={20} />}
          />
          <MetricCard
            title="Today's Consultations"
            value={String(data.todayConsultations)}
            description="Scheduled"
            icon={<IconCalendarDue size={20} />}
          />
          <MetricCard
            title="Awaiting You"
            value={String(data.awaitingClinician)}
            description="Ready to start"
            icon={<IconMessageChatbot size={20} />}
          />
          <MetricCard
            title="Completed"
            value={String(data.completedConsultations)}
            description="This month"
            icon={<IconClipboardCheck size={20} />}
          />
        </MetricGrid>

        <ContentGrid>
          <ClinicianConsultationsList consultations={data.recentConsultations} />
          <ActivityCard title="Upcoming Schedule">
            {data.appointments.length > 0 ? (
              <div className="divide-y divide-border">
                {data.appointments.map((apt: any) => (
                  <div key={apt.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary">{apt.title}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(apt.date).toLocaleDateString()} at {apt.time}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-brand bg-brand/10 px-2 py-1 rounded-lg">
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<IconCalendarDue size={24} />}
                title="No appointments scheduled"
                description="Your schedule for today is clear."
              />
            )}
          </ActivityCard>
        </ContentGrid>

        <QuickActionsCard
          actions={[
            { label: "View Schedule", icon: <IconCalendarPlus size={18} /> },
            { label: "Patient List", icon: <IconList size={18} /> },
            { label: "Start Consultation", icon: <IconStethoscope size={18} /> },
            { label: "Update Profile", icon: <IconUserEdit size={18} /> },
          ]}
        />
      </DashboardShell>
    </AuthGuard>
  );
}
