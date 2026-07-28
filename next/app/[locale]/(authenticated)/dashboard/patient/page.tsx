import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell, MetricGrid, ContentGrid } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { PatientConsultationsList } from "./consultations-list";
import { getPatientOverview } from "./data";
import { IconCalendarDue, IconPill, IconFiles, IconMessageChatbot, IconCalendarPlus, IconClipboardList, IconMessage2, IconRefresh } from "@tabler/icons-react";

export default async function PatientDashboard() {
  const data = await getPatientOverview();

  return (
    <AuthGuard allowedRoles={["patient"]}>
      <DashboardHeader
        title="Patient Dashboard"
        description="Manage your health records and appointments"
      />

      <DashboardShell>
        <MetricGrid>
          <MetricCard
            title="Active Consultations"
            value={String(data.activeConsultations)}
            description="In progress"
            icon={<IconMessageChatbot size={20} />}
          />
          <MetricCard
            title="Upcoming Appointments"
            value={String(data.upcomingAppointments)}
            description="Next 30 days"
            icon={<IconCalendarDue size={20} />}
          />
          <MetricCard
            title="Prescriptions"
            value={String(data.prescriptions)}
            description="Active"
            icon={<IconPill size={20} />}
          />
          <MetricCard
            title="Medical Records"
            value={String(data.medicalRecords)}
            description="On file"
            icon={<IconFiles size={20} />}
          />
        </MetricGrid>

        <ContentGrid>
          <PatientConsultationsList consultations={data.recentConsultations} />
          <ActivityCard title="Upcoming Appointments">
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
                title="No upcoming appointments"
                description="Book a consultation with a clinician to get started."
              />
            )}
          </ActivityCard>
        </ContentGrid>

        <QuickActionsCard
          actions={[
            { label: "New Consultation", icon: <IconMessageChatbot size={18} />, href: "/dashboard/patient/consultations/new" },
            { label: "Book Appointment", icon: <IconCalendarPlus size={18} /> },
            { label: "View Records", icon: <IconClipboardList size={18} /> },
            { label: "Request Refill", icon: <IconRefresh size={18} /> },
          ]}
        />
      </DashboardShell>
    </AuthGuard>
  );
}
