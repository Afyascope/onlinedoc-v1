"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MetricGrid } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { IconCalendarDue, IconCalendarStats, IconClock } from "@tabler/icons-react";
import { format } from "date-fns";

interface Appointment {
  id: string;
  patientId: string;
  title: string;
  date: string;
  time: string | null;
  type: string;
  status: string;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700",
  confirmed: "bg-green-50 text-green-700",
  completed: "bg-neutral-100 text-neutral-600",
  cancelled: "bg-red-50 text-red-600",
};

export function ClinicianScheduleClient({ appointments: list }: { appointments: Appointment[] }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const todayAppointments = list.filter((a) => a.date === today && a.status !== "cancelled");
  const upcoming = list.filter((a) => a.date > today && (a.status === "scheduled" || a.status === "confirmed"));

  return (
    <AuthGuard allowedRoles={["clinician"]}>
      <DashboardHeader
        title="Schedule"
        description="Manage your appointments"
      />

      <DashboardShell>
        <MetricGrid columns={2}>
          <MetricCard
            title="Today's Appointments"
            value={todayAppointments.length}
            icon={<IconCalendarStats size={20} />}
          />
          <MetricCard
            title="Upcoming"
            value={upcoming.length}
            icon={<IconClock size={20} />}
          />
        </MetricGrid>

        <ActivityCard title="Today's Schedule">
          {todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <IconCalendarDue size={40} stroke={1.5} />
              <p className="mt-3 text-sm text-neutral-500 font-secondary">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-brand/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">{a.time ? a.time.slice(0, 5) : "--"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{a.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5 capitalize">{a.type.replace("_", " ")}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[a.status] || "bg-neutral-100 text-neutral-600"}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ActivityCard>

        <ActivityCard title="Upcoming Appointments">
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <IconCalendarDue size={40} stroke={1.5} />
              <p className="mt-3 text-sm text-neutral-500 font-secondary">No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-border">
                  <div>
                    <p className="text-sm font-semibold text-primary">{a.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {format(new Date(a.date), "MMM d, yyyy")}
                      {a.time && ` at ${a.time.slice(0, 5)}`}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[a.status] || "bg-neutral-100 text-neutral-600"}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ActivityCard>
      </DashboardShell>
    </AuthGuard>
  );
}
