"use client";

import { useState, useCallback } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  IconStethoscope, IconCheck, IconClock, IconSearch,
  IconBan, IconRefresh, IconX, IconEdit,
} from "@tabler/icons-react";
import { format } from "date-fns";
import {
  approveClinician, rejectClinician, toggleUserBan, updateClinicianProfile,
} from "@/lib/actions/admin";
import { getClinicianStatus } from "@/lib/clinician-status";

interface ClinicianProfile {
  userId: string;
  specialization: string | null;
  qualifications: string | null;
  yearsOfExperience: number | null;
  consultationFee: string | null;
}

interface Clinician {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  clinicianApproved: boolean;
  clinicianStatus: string;
  banned: boolean;
  createdAt: Date;
  profile: ClinicianProfile | null;
  consultationCount: number;
}

export function AdminCliniciansClient({ clinicians: initial }: { clinicians: Clinician[] }) {
  const [clinicians, setClinicians] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actingId, setActingId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ action: string; userId: string; userName: string } | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ specialization: "", qualifications: "", consultationFee: "" });
  const statusOf = (c: Clinician) => getClinicianStatus(c);

  const filtered = clinicians.filter((c) => {
    const matchesSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "pending" && statusOf(c) === "PENDING" && !c.banned) ||
      (statusFilter === "approved" && statusOf(c) === "APPROVED" && !c.banned) ||
      (statusFilter === "rejected" && statusOf(c) === "REJECTED" && !c.banned) ||
      (statusFilter === "suspended" && (statusOf(c) === "SUSPENDED" || c.banned));
    return matchesSearch && matchesStatus;
  });

  const pending = clinicians.filter((c) => statusOf(c) === "PENDING" && !c.banned);
  const approved = clinicians.filter((c) => statusOf(c) === "APPROVED" && !c.banned);
  const suspended = clinicians.filter((c) => statusOf(c) === "SUSPENDED" || c.banned);

  const handleConfirm = useCallback(async () => {
    if (!confirmState) return;
    setActingId(confirmState.userId);
    const { action, userId } = confirmState;
    if (action === "approve") {
      await approveClinician(userId);
      setClinicians((prev) => prev.map((c) => c.id === userId ? { ...c, clinicianApproved: true, clinicianStatus: "APPROVED" } : c));
    } else if (action === "reject") {
      await rejectClinician(userId);
      setClinicians((prev) => prev.map((c) => c.id === userId ? { ...c, clinicianApproved: false, clinicianStatus: "REJECTED" } : c));
    } else if (action === "toggle_ban") {
      const c = clinicians.find((x) => x.id === userId);
      if (!c) return;
      await toggleUserBan(userId, !c.banned);
      setClinicians((prev) => prev.map((c) => c.id === userId ? { ...c, banned: !c.banned } : c));
    }
    setActingId(null);
    setConfirmState(null);
  }, [confirmState, clinicians]);

  const openEdit = (c: Clinician) => {
    setEditUserId(c.id);
    setEditForm({
      specialization: c.profile?.specialization || "",
      qualifications: c.profile?.qualifications || "",
      consultationFee: c.profile?.consultationFee || "",
    });
  };

  const saveEdit = async () => {
    if (!editUserId) return;
    setActingId(editUserId);
    await updateClinicianProfile(editUserId, editForm);
    setClinicians((prev) => prev.map((c) => c.id === editUserId ? {
      ...c,
      profile: { ...c.profile, specialization: editForm.specialization, qualifications: editForm.qualifications, consultationFee: editForm.consultationFee } as ClinicianProfile,
    } : c));
    setActingId(null);
    setEditUserId(null);
  };

  const columns: Column<Clinician>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-semibold">
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-primary">{c.name}</p>
            <p className="text-xs text-neutral-500">{c.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "specialization",
      label: "Specialization",
      render: (c) => <span className="text-sm text-neutral-600">{c.profile?.specialization || "—"}</span>,
    },
    {
      key: "clinicianApproved",
      label: "Status",
      render: (c) => <StatusBadge status={c.banned ? "suspended" : statusOf(c).toLowerCase()} />,
    },
    {
      key: "consultationCount",
      label: "Consultations",
      sortable: true,
      render: (c) => <span className="text-sm font-medium">{c.consultationCount}</span>,
    },
    {
      key: "fee",
      label: "Fee",
      render: (c) => <span className="text-sm">{c.profile?.consultationFee ? `KES ${c.profile.consultationFee}` : "—"}</span>,
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (c) => <span className="text-xs text-neutral-500">{format(new Date(c.createdAt), "MMM d, yyyy")}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (c) => (
        <div className="flex items-center gap-1.5">
          {statusOf(c) === "PENDING" && !c.banned && (
            <>
              <button onClick={() => setConfirmState({ action: "approve", userId: c.id, userName: c.name })}
                className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors" title="Approve">
                <IconCheck size={16} />
              </button>
              <button onClick={() => setConfirmState({ action: "reject", userId: c.id, userName: c.name })}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Reject">
                <IconX size={16} />
              </button>
            </>
          )}
          {statusOf(c) === "APPROVED" && (
            <button onClick={() => setConfirmState({ action: "toggle_ban", userId: c.id, userName: c.name })}
              className={`p-1.5 rounded-lg transition-colors ${c.banned ? "text-green-500 hover:bg-green-50" : "text-red-400 hover:bg-red-50"}`}
              title={c.banned ? "Reactivate" : "Suspend"}>
              {c.banned ? <IconRefresh size={16} /> : <IconBan size={16} />}
            </button>
          )}
          <button onClick={() => openEdit(c)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-brand hover:bg-brand/5 transition-colors" title="Edit">
            <IconEdit size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader title="Clinicians" description="Manage clinician accounts" />

      <DashboardShell>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-neutral-500 font-secondary">Total</p>
            <p className="text-2xl font-bold text-primary mt-1">{clinicians.length}</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-neutral-500 font-secondary">Approved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{approved.length}</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-neutral-500 font-secondary">Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pending.length}</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-neutral-500 font-secondary">Suspended</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{suspended.length}</p>
          </div>
        </div>

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
                      {c.profile?.specialization && <p className="text-xs text-neutral-400 mt-0.5">{c.profile.specialization}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setConfirmState({ action: "approve", userId: c.id, userName: c.name })}
                      disabled={actingId === c.id}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50">
                      {actingId === c.id ? "..." : "Approve"}
                    </button>
                    <button onClick={() => setConfirmState({ action: "reject", userId: c.id, userName: c.name })}
                      disabled={actingId === c.id}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ActivityCard>
        )}

        <ActivityCard
          title="All Clinicians"
          action={
            <div className="flex items-center gap-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-2 focus:ring-brand/20">
                <option value="all">All</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
              <div className="relative">
                <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 w-48" />
              </div>
            </div>
          }
        >
          <DataTable columns={columns} data={filtered} keyField="id"
            emptyMessage="No clinicians found" emptyIcon={<IconStethoscope size={40} stroke={1.5} />} />
        </ActivityCard>
      </DashboardShell>

      {editUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setEditUserId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-border w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-primary font-primary mb-4">Edit Clinician Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Specialization</label>
                <input value={editForm.specialization} onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Qualifications</label>
                <input value={editForm.qualifications} onChange={(e) => setEditForm({ ...editForm, qualifications: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Consultation Fee ($)</label>
                <input value={editForm.consultationFee} onChange={(e) => setEditForm({ ...editForm, consultationFee: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditUserId(null)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-colors">Cancel</button>
                <button onClick={saveEdit} disabled={actingId === editUserId}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-50">
                  {actingId === editUserId ? "..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.action === "approve" ? "Approve Clinician"
          : confirmState?.action === "reject" ? "Reject Clinician"
          : confirmState?.action === "toggle_ban"
            ? (clinicians.find((c) => c.id === confirmState?.userId)?.banned ? "Reactivate Clinician" : "Suspend Clinician")
            : ""}
        message={confirmState?.action === "approve" ? `Approve ${confirmState?.userName} as a clinician?`
          : confirmState?.action === "reject" ? `Reject ${confirmState?.userName}'s application?`
          : confirmState?.action === "toggle_ban"
            ? (clinicians.find((c) => c.id === confirmState?.userId)?.banned
              ? `Reactivate ${confirmState?.userName}?`
              : `Suspend ${confirmState?.userName}? They will be unable to access the platform.`)
            : ""}
        variant={confirmState?.action === "approve" ? "default"
          : confirmState?.action === "reject" ? "danger"
          : "danger"}
        confirmLabel={confirmState?.action === "approve" ? "Approve"
          : confirmState?.action === "reject" ? "Reject"
          : "Confirm"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState(null)}
        loading={actingId === confirmState?.userId}
      />
    </AuthGuard>
  );
}
