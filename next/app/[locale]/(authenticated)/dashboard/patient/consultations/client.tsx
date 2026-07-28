"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ConsultationCard } from "@/components/consultations/ConsultationCard";
import { IconPlus, IconStethoscope } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

interface Consultation {
  id: string;
  title: string;
  consultationType: string;
  status: string;
  fee: string;
  createdAt: Date;
}

export function PatientConsultationsClient({ consultations: list }: { consultations: Consultation[] }) {
  const router = useRouter();
  const active = list.filter((c) => !["completed", "closed"].includes(c.status));
  const history = list.filter((c) => ["completed", "closed"].includes(c.status));

  return (
    <AuthGuard allowedRoles={["patient"]}>
      <DashboardHeader
        title="Consultations"
        description="Request and manage your medical consultations"
      />

      <DashboardShell>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary font-primary">Active Consultations</h2>
          <button
            onClick={() => router.push("/dashboard/patient/consultations/new")}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors"
          >
            <IconPlus size={16} />
            New Consultation
          </button>
        </div>

        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400 bg-white border border-border rounded-2xl">
            <IconStethoscope size={48} stroke={1.5} />
            <p className="mt-4 text-sm text-neutral-500 font-secondary">No active consultations</p>
            <button
              onClick={() => router.push("/dashboard/patient/consultations/new")}
              className="mt-4 px-4 py-2 text-sm font-medium text-brand bg-brand/5 hover:bg-brand/10 rounded-xl transition-colors"
            >
              Start a Consultation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {active.map((c) => (
              <ConsultationCard key={c.id} consultation={c} href={`/dashboard/patient/consultations/${c.id}`} />
            ))}
          </div>
        )}

        {history.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-primary font-primary mb-4">Consultation History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((c) => (
                <ConsultationCard key={c.id} consultation={c} href={`/dashboard/patient/consultations/${c.id}`} />
              ))}
            </div>
          </>
        )}
      </DashboardShell>
    </AuthGuard>
  );
}
