"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell, MetricGrid } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { ConsultationCard } from "@/components/consultations/ConsultationCard";
import { updateConsultationStatus } from "@/lib/actions/consultations";
import { useRouter } from "next/navigation";
import { IconStethoscope, IconUsers, IconAlertCircle, IconCheck } from "@tabler/icons-react";

interface Consultation {
  id: string;
  title: string;
  consultationType: string;
  status: string;
  fee: string;
  createdAt: Date;
  patientId: string;
}

export function ClinicianConsultationsClient({
  consultations: list,
  unassigned,
  clinicianId,
}: {
  consultations: Consultation[];
  unassigned: Consultation[];
  clinicianId: string;
}) {
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);
  const todayConsultations = list.filter((c) =>
    c.createdAt.toString().slice(0, 10) === today
  );
  const urgent = list.filter((c) => c.consultationType === "urgent" && c.status !== "completed" && c.status !== "closed");
  const waiting = list.filter((c) => c.status === "waiting_for_clinician");
  const completed = list.filter((c) => c.status === "completed");

  const handleAssign = async (id: string) => {
    await updateConsultationStatus(id, "waiting_for_clinician");
    router.refresh();
  };

  return (
    <AuthGuard allowedRoles={["clinician"]}>
      <DashboardHeader
        title="Consultations"
        description="Manage your patient consultations"
      />

      <DashboardShell>
        <MetricGrid columns={4}>
          <MetricCard title="Today's Consultations" value={todayConsultations.length} icon={<IconStethoscope size={20} />} />
          <MetricCard title="Waiting Patients" value={waiting.length} icon={<IconUsers size={20} />} />
          <MetricCard title="Urgent" value={urgent.length} icon={<IconAlertCircle size={20} />} />
          <MetricCard title="Completed Today" value={completed.length} icon={<IconCheck size={20} />} />
        </MetricGrid>

        {unassigned.length > 0 && (
          <ActivityCard title="Paid Consultations — Assign to Yourself">
            <div className="space-y-3">
              {unassigned.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-amber-200 bg-amber-50/30">
                  <div>
                    <p className="text-sm font-semibold text-primary">{c.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 capitalize">
                      {c.consultationType.replace("_", " ")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAssign(c.id)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-brand hover:bg-brand-hover rounded-lg transition-colors"
                  >
                    Assign to Me
                  </button>
                </div>
              ))}
            </div>
          </ActivityCard>
        )}

        <ActivityCard title="All Consultations">
          {list.length === 0 && unassigned.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <IconStethoscope size={40} stroke={1.5} />
              <p className="mt-3 text-sm text-neutral-500 font-secondary">No consultations yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...unassigned.filter((u) => !list.find((l) => l.id === u.id)), ...list].map((c) => (
                <ConsultationCard
                  key={c.id}
                  consultation={c}
                  href={`/dashboard/clinician/consultations/${c.id}`}
                />
              ))}
            </div>
          )}
        </ActivityCard>
      </DashboardShell>
    </AuthGuard>
  );
}
