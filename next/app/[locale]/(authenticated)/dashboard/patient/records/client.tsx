"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { IconFiles, IconStethoscope, IconFlask, IconClipboardList, IconPill } from "@tabler/icons-react";
import { format } from "date-fns";

interface Record {
  id: string;
  clinicianId: string;
  type: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  recordDate: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  lab: { icon: <IconFlask size={18} />, label: "Lab" },
  test: { icon: <IconFlask size={18} />, label: "Test" },
  diagnosis: { icon: <IconStethoscope size={18} />, label: "Diagnosis" },
  visit: { icon: <IconClipboardList size={18} />, label: "Visit" },
  prescription: { icon: <IconPill size={18} />, label: "Prescription" },
};

export function PatientRecordsClient({ records }: { records: Record[] }) {
  return (
    <AuthGuard allowedRoles={["patient"]}>
      <DashboardHeader
        title="Medical Records"
        description="View your medical history and documents"
      />

      <DashboardShell>
        <ActivityCard title="All Records">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <IconFiles size={40} stroke={1.5} />
              <p className="mt-3 text-sm text-neutral-500 font-secondary">No medical records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((r) => {
                const config = typeConfig[r.type] || { icon: <IconFiles size={18} />, label: r.type };
                return (
                  <div key={r.id} className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-brand/20 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center text-brand shrink-0">
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary">{r.title}</p>
                      {r.description && (
                        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{r.description}</p>
                      )}
                      <p className="text-xs text-neutral-400 mt-1">
                        {config.label} &middot; {format(new Date(r.recordDate), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ActivityCard>
      </DashboardShell>
    </AuthGuard>
  );
}
