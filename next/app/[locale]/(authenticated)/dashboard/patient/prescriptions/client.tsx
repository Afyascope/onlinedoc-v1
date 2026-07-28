"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { IconPill, IconRefresh } from "@tabler/icons-react";
import { format } from "date-fns";

interface Prescription {
  id: string;
  clinicianId: string;
  medication: string;
  dosage: string;
  frequency: string;
  instructions: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
  refillsRemaining: number;
  refillsTotal: number;
}

const statusColors: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  completed: "bg-neutral-100 text-neutral-600",
  cancelled: "bg-red-50 text-red-600",
};

export function PatientPrescriptionsClient({ prescriptions: list }: { prescriptions: Prescription[] }) {
  const active = list.filter((p) => p.status === "active");
  const past = list.filter((p) => p.status !== "active");

  return (
    <AuthGuard allowedRoles={["patient"]}>
      <DashboardHeader
        title="Prescriptions"
        description="View and manage your medications"
      />

      <DashboardShell>
        <ActivityCard title="Active Prescriptions">
          {active.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <IconPill size={40} stroke={1.5} />
              <p className="mt-3 text-sm text-neutral-500 font-secondary">No active prescriptions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((p) => (
                <div key={p.id} className="p-4 rounded-xl border border-border hover:border-brand/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-primary">{p.medication}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{p.dosage} &middot; {p.frequency}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[p.status]}`}>
                      {p.status}
                    </span>
                  </div>
                  {p.instructions && (
                    <p className="text-xs text-neutral-500 mt-2">{p.instructions}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-neutral-400">
                      {format(new Date(p.startDate), "MMM d, yyyy")}
                      {p.endDate && ` - ${format(new Date(p.endDate), "MMM d, yyyy")}`}
                    </p>
                    <p className="text-xs font-medium text-neutral-500">
                      Refills: {p.refillsRemaining}/{p.refillsTotal}
                    </p>
                  </div>
                  {p.refillsRemaining > 0 && (
                    <button className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-hover transition-colors">
                      <IconRefresh size={14} />
                      Request Refill
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ActivityCard>

        <ActivityCard title="Past Prescriptions">
          {past.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <IconPill size={40} stroke={1.5} />
              <p className="mt-3 text-sm text-neutral-500 font-secondary">No past prescriptions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {past.map((p) => (
                <div key={p.id} className="p-4 rounded-xl border border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-primary">{p.medication}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{p.dosage} &middot; {p.frequency}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[p.status] || "bg-neutral-100 text-neutral-600"}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    {format(new Date(p.startDate), "MMM d, yyyy")}
                    {p.endDate && ` - ${format(new Date(p.endDate), "MMM d, yyyy")}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ActivityCard>
      </DashboardShell>
    </AuthGuard>
  );
}
