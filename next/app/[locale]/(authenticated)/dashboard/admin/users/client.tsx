"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MetricGrid } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { IconUsers, IconSearch, IconShield, IconStethoscope, IconUser } from "@tabler/icons-react";
import { format } from "date-fns";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  clinicianApproved: boolean;
  createdAt: Date;
}

const roleColors: Record<string, string> = {
  patient: "bg-blue-50 text-blue-700",
  clinician: "bg-green-50 text-green-700",
  admin: "bg-purple-50 text-purple-700",
};

export function AdminUsersClient({ users }: { users: AdminUser[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const counts = {
    total: users.length,
    patients: users.filter((u) => u.role === "patient").length,
    clinicians: users.filter((u) => u.role === "clinician").length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader
        title="Users"
        description="Manage all platform users"
      />

      <DashboardShell>
        <MetricGrid columns={4}>
          <MetricCard title="Total Users" value={counts.total} icon={<IconUsers size={20} />} />
          <MetricCard title="Patients" value={counts.patients} icon={<IconUser size={20} />} />
          <MetricCard title="Clinicians" value={counts.clinicians} icon={<IconStethoscope size={20} />} />
          <MetricCard title="Admins" value={counts.admins} icon={<IconShield size={20} />} />
        </MetricGrid>

        <ActivityCard
          title="All Users"
          action={
            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                <option value="all">All Roles</option>
                <option value="patient">Patient</option>
                <option value="clinician">Clinician</option>
                <option value="admin">Admin</option>
              </select>
              <div className="relative">
                <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all w-48"
                />
              </div>
            </div>
          }
        >
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <IconUsers size={40} stroke={1.5} />
              <p className="mt-3 text-sm text-neutral-500 font-secondary">
                {search ? "No users matching your search" : "No users found"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">Name</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">Email</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">Role</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">Verified</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-semibold">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-primary">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-neutral-600">{u.email}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[u.role] || "bg-neutral-100 text-neutral-600"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-xs font-medium ${u.emailVerified ? "text-green-600" : "text-amber-600"}`}>
                          {u.emailVerified ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-neutral-500 text-xs">
                        {format(new Date(u.createdAt), "MMM d, yyyy")}
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
