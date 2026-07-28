"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MetricGrid } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { IconStethoscope, IconCheck, IconClock } from "@tabler/icons-react";
import { approveClinician, rejectClinician } from "@/lib/actions/admin";
import { format } from "date-fns";

interface ClinicianProfile {
  userId: string;
  specialization: string | null;
  qualifications: string | null;
  yearsOfExperience: number | null;
}

interface Clinician {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  clinicianApproved: boolean;
  createdAt: Date;
  profile: ClinicianProfile | null;
}

export function AdminCliniciansClient({ clinicians: initial }: { clinicians: Clinician[] }) {
  const [clinicians, setClinicians] = useState(initial);
  const [actingId, setActingId] = useState<string | null>(null);

  const pending = clinicians.filter((c) => !c.clinicianApproved);
  const approved = clinicians.filter((c) => c.clinicianApproved);

  const handleApprove = async (userId: string) => {
    setActingId(userId);
    await approveClinician(userId);
    setClinicians((prev) => prev.map((c) => c.id === userId ? { ...c, clinicianApproved: true } : c));
    setActingId(null);
  };

  const handleReject = async (userId: string) => {
    setActingId(userId);
    await rejectClinician(userId);
    setClinicians((prev) => prev.map((c) => c.id === userId ? { ...c, clinicianApproved: false } : c));
    setActingId(null);
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader
        title="Clinicians"
        description="Manage and approve clinician accounts"
      />

      <DashboardShell>
        <MetricGrid columns={3}>
          <MetricCard title="Total Clinicians" value={clinicians.length} icon={<IconStethoscope size={20} />} />
          <MetricCard title="Approved" value={approved.length} icon={<IconCheck size={20} />} />
          <MetricCard title="Pending Approval" value={pending.length} icon={<IconClock size={20} />} />
        </MetricGrid>

        {pending.length > 0 && (
          <ActivityCard title="Pending Approval">
            <div className="space-y-3">
              {pending.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-amber-200 bg-amber-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{c.name}</p>
                      <p className="text-xs text-neutral-500">{c.email}</p>
                      {c.profile?.specialization && (
                        <p className="text-xs text-neutral-400 mt-0.5">{c.profile.specialization}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(c.id)}
                      disabled={actingId === c.id}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actingId === c.id ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(c.id)}
                      disabled={actingId === c.id}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ActivityCard>
        )}

        <ActivityCard title="All Clinicians">
          {approved.length === 0 && pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <IconStethoscope size={40} stroke={1.5} />
              <p className="mt-3 text-sm text-neutral-500 font-secondary">No clinicians registered</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">Name</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">Specialization</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {clinicians.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-semibold">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-primary">{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-neutral-600">
                        {c.profile?.specialization || "—"}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.clinicianApproved ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                          {c.clinicianApproved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-neutral-500 text-xs">
                        {format(new Date(c.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ActivityCard>
      </DashboardShell>
    </AuthGuard>
  );
}
