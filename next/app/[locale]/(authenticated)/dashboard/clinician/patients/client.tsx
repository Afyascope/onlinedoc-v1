"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { IconUsers, IconSearch, IconMail, IconCalendarDue } from "@tabler/icons-react";
import { format } from "date-fns";

interface Patient {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export function ClinicianPatientsClient({ patients }: { patients: Patient[] }) {
  const [search, setSearch] = useState("");

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthGuard allowedRoles={["clinician"]}>
      <DashboardHeader
        title="Patients"
        description="View and manage your patients"
      />

      <DashboardShell>
        <ActivityCard
          title="All Patients"
          action={
            <div className="relative">
              <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all w-48"
              />
            </div>
          }
        >
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <IconUsers size={40} stroke={1.5} />
              <p className="mt-3 text-sm text-neutral-500 font-secondary">
                {search ? "No patients matching your search" : "No patients assigned yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-brand/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-semibold text-sm">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{p.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                          <IconMail size={12} />
                          {p.email}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-neutral-400">
                          <IconCalendarDue size={12} />
                          {format(new Date(p.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 text-xs font-medium text-brand bg-brand/5 hover:bg-brand/10 rounded-lg transition-colors">
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </ActivityCard>
      </DashboardShell>
    </AuthGuard>
  );
}
