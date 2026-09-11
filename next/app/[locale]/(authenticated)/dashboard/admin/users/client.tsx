"use client";

import { useState, useCallback, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  IconUsers, IconSearch, IconShield, IconStethoscope, IconUser,
  IconEye, IconBan, IconCheck, IconRotate, IconRefresh,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { toggleUserBan, verifyUserEmail, resetUserPassword, getUserDetail } from "@/lib/actions/admin";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  clinicianApproved: boolean;
  banned: boolean;
  createdAt: Date;
}

export function AdminUsersClient({ users: initial, total }: { users: AdminUser[]; total: number }) {
  const [users, setUsers] = useState(initial);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmState, setConfirmState] = useState<{ action: string; userId: string; userName: string } | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchesSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && !u.banned) ||
      (statusFilter === "suspended" && u.banned);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const counts = {
    total: users.length,
    active: users.filter((u) => !u.banned).length,
    suspended: users.filter((u) => u.banned).length,
  };

  const handleConfirm = useCallback(async () => {
    if (!confirmState) return;
    setActingId(confirmState.userId);
    if (confirmState.action === "toggle_ban") {
      const u = users.find((x) => x.id === confirmState.userId);
      if (!u) return;
      await toggleUserBan(confirmState.userId, !u.banned);
      setUsers((prev) => prev.map((x) => x.id === confirmState.userId ? { ...x, banned: !x.banned } : x));
    } else if (confirmState.action === "verify_email") {
      await verifyUserEmail(confirmState.userId);
      setUsers((prev) => prev.map((x) => x.id === confirmState.userId ? { ...x, emailVerified: true } : x));
    } else if (confirmState.action === "reset_password") {
      await resetUserPassword(confirmState.userId);
    }
    setActingId(null);
    setConfirmState(null);
  }, [confirmState, users]);

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-semibold">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-primary">{u.name}</p>
            <p className="text-xs text-neutral-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (u) => <StatusBadge status={u.role} />,
    },
    {
      key: "emailVerified",
      label: "Verified",
      sortable: true,
      render: (u) => <StatusBadge status={u.emailVerified ? "verified" : "unverified"} />,
    },
    {
      key: "banned",
      label: "Status",
      render: (u) => <StatusBadge status={u.banned ? "suspended" : "active"} />,
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (u) => (
        <span className="text-xs text-neutral-500">{format(new Date(u.createdAt), "MMM d, yyyy")}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (u) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDetailUserId(detailUserId === u.id ? null : u.id)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-brand hover:bg-brand/5 transition-colors"
            title="View details"
          >
            <IconEye size={16} />
          </button>
          <button
            onClick={() => setConfirmState({ action: "toggle_ban", userId: u.id, userName: u.name })}
            className={`p-1.5 rounded-lg transition-colors ${
              u.banned
                ? "text-green-500 hover:text-green-600 hover:bg-green-50"
                : "text-red-400 hover:text-red-500 hover:bg-red-50"
            }`}
            title={u.banned ? "Reactivate" : "Suspend"}
          >
            {u.banned ? <IconRefresh size={16} /> : <IconBan size={16} />}
          </button>
          {!u.emailVerified && (
            <button
              onClick={() => setConfirmState({ action: "verify_email", userId: u.id, userName: u.name })}
              className="p-1.5 rounded-lg text-amber-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
              title="Verify email"
            >
              <IconCheck size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader title="Users" description="Manage all platform users" />

      <DashboardShell>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-neutral-500 font-secondary">Total Users</p>
            <p className="text-2xl font-bold text-primary mt-1">{counts.total}</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-neutral-500 font-secondary">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{counts.active}</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-neutral-500 font-secondary">Suspended</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{counts.suspended}</p>
          </div>
        </div>

        <ActivityCard
          title="All Users"
          action={
            <div className="flex items-center gap-2 flex-wrap">
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <div className="relative">
                <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 w-48"
                />
              </div>
            </div>
          }
        >
          <DataTable
            columns={columns}
            data={filtered}
            keyField="id"
            emptyMessage="No users found"
            emptyIcon={<IconUsers size={40} stroke={1.5} />}
          />
        </ActivityCard>

        {detailUserId && <UserDetailPanel userId={detailUserId} onClose={() => setDetailUserId(null)} />}
      </DashboardShell>

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.action === "toggle_ban"
          ? (users.find((u) => u.id === confirmState?.userId)?.banned ? "Reactivate User" : "Suspend User")
          : confirmState?.action === "verify_email" ? "Verify Email" : "Reset Password"
        }
        message={confirmState?.action === "toggle_ban"
          ? (users.find((u) => u.id === confirmState?.userId)?.banned
            ? `Reactivate ${confirmState?.userName}?`
            : `Suspend ${confirmState?.userName}? They will be unable to access the platform.`)
          : confirmState?.action === "verify_email"
            ? `Mark ${confirmState?.userName}'s email as verified?`
            : `Send a password reset email to ${confirmState?.userName}?`
        }
        variant={confirmState?.action === "toggle_ban" && !users.find((u) => u.id === confirmState?.userId)?.banned ? "danger" : "default"}
        confirmLabel={confirmState?.action === "toggle_ban"
          ? (users.find((u) => u.id === confirmState?.userId)?.banned ? "Reactivate" : "Suspend")
          : confirmState?.action === "verify_email" ? "Verify" : "Send Reset"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState(null)}
        loading={actingId === confirmState?.userId}
      />
    </AuthGuard>
  );
}

function UserDetailPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    getUserDetail(userId).then((d) => { setDetail(d); setLoading(false); }).catch(() => setLoading(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-border w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-primary font-primary">User Details</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-primary transition-colors text-sm">Close</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="h-6 w-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>
        ) : detail ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-lg">
                {detail.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-primary text-lg">{detail.user.name}</p>
                <p className="text-sm text-neutral-500">{detail.user.email}</p>
                <div className="flex gap-2 mt-1">
                  <StatusBadge status={detail.user.role} />
                  <StatusBadge status={detail.user.emailVerified ? "verified" : "unverified"} />
                  <StatusBadge status={detail.user.banned ? "suspended" : "active"} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-500 font-secondary">Registered</p>
                <p className="font-medium">{format(new Date(detail.user.createdAt), "MMM d, yyyy h:mm a")}</p>
              </div>
              <div>
                <p className="text-neutral-500 font-secondary">Last Updated</p>
                <p className="font-medium">{format(new Date(detail.user.updatedAt), "MMM d, yyyy h:mm a")}</p>
              </div>
              {detail.profile && (
                <>
                  <div>
                    <p className="text-neutral-500 font-secondary">Specialization</p>
                    <p className="font-medium">{detail.profile.specialization || "—"}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 font-secondary">Qualifications</p>
                    <p className="font-medium">{detail.profile.qualifications || "—"}</p>
                  </div>
                </>
              )}
            </div>

            {detail.consultations.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-primary mb-2">Recent Consultations ({detail.consultations.length})</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {detail.consultations.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                      <span className="text-neutral-600 truncate max-w-[200px]">{c.title}</span>
                      <StatusBadge status={c.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.orders.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-primary mb-2">Recent Orders ({detail.orders.length})</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {detail.orders.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                      <span className="text-neutral-600">KES {o.totalAmount} {o.currency}</span>
                      <StatusBadge status={o.paymentStatus} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.loginHistory.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-primary mb-2">Login History</p>
                <div className="space-y-1">
                  {detail.loginHistory.map((log: any) => (
                    <p key={log.id} className="text-xs text-neutral-500">
                      {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-neutral-500 py-4">Failed to load user details</p>
        )}
      </div>
    </div>
  );
}
