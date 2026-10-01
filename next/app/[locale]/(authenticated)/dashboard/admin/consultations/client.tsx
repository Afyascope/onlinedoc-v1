"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  IconMessageChatbot, IconSearch, IconEye, IconX, IconCheck,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { assignConsultationClinician, cancelConsultation, closeConsultation } from "@/lib/actions/admin";

const statusLabels = [
  "draft", "awaiting_payment", "paid", "waiting_for_clinician",
  "in_consultation", "completed", "follow_up_required", "closed",
];

interface Consultation {
  id: string;
  patientId: string;
  clinicianId: string | null;
  consultationType: string;
  title: string;
  symptoms: string | null;
  status: string;
  fee: string;
  createdAt: Date;
  paidAt: Date | null;
  patient: { id: string; name: string; email: string } | null;
  clinician: { id: string; name: string; email: string } | null;
}

interface ApprovedClinician { id: string; name: string }

export function ConsultationsClient({ initialConsultations, total, approvedClinicians }: { initialConsultations: Consultation[]; total: number; approvedClinicians: ApprovedClinician[] }) {
  const router = useRouter();
  const [consultations, setConsultations] = useState(initialConsultations);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmState, setConfirmState] = useState<{ action: string; id: string } | null>(null);
  const [acting, setActing] = useState(false);
  const [detailCon, setDetailCon] = useState<Consultation | null>(null);
  const [selectedClinicians, setSelectedClinicians] = useState<Record<string, string>>({});
  const [assignmentError, setAssignmentError] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const handleAssign = async (consultation: Consultation) => {
    const clinicianId = selectedClinicians[consultation.id];
    if (!clinicianId) return;
    setAssignmentError("");
    setAssigningId(consultation.id);
    const result = await assignConsultationClinician(consultation.id, clinicianId);
    setAssigningId(null);
    if (!result.success) {
      setAssignmentError(result.error || "Unable to assign this consultation.");
      return;
    }
    const clinician = approvedClinicians.find((candidate) => candidate.id === clinicianId);
    setConsultations((current) => current.map((item) => item.id === consultation.id
      ? { ...item, clinicianId, clinician: clinician ? { ...clinician, email: "" } : null, status: "waiting_for_clinician" }
      : item));
    router.refresh();
  };

  const filtered = consultations.filter((c) => {
    const matchesSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.patient?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = statusLabels.reduce((acc, s) => {
    acc[s] = consultations.filter((c) => c.status === s).length;
    return acc;
  }, {} as Record<string, number>);
  const unassignedPaidCount = consultations.filter((c) =>
    c.status === "paid" && !c.clinicianId && c.paidAt !== null
  ).length;

  const handleConfirm = useCallback(async () => {
    if (!confirmState) return;
    setActing(true);
    if (confirmState.action === "cancel") await cancelConsultation(confirmState.id);
    if (confirmState.action === "close") await closeConsultation(confirmState.id);
    setConsultations((prev) => prev.map((c) =>
      c.id === confirmState.id ? { ...c, status: "closed" } : c
    ));
    setActing(false);
    setConfirmState(null);
  }, [confirmState]);

  const columns: Column<Consultation>[] = [
    {
      key: "title",
      label: "Title",
      render: (c) => (
        <div>
          <p className="font-medium text-primary">{c.title}</p>
          <p className="text-xs text-neutral-500">{c.consultationType}</p>
        </div>
      ),
    },
    {
      key: "patientName",
      label: "Patient",
      render: (c) => <span className="text-sm">{c.patient?.name || "—"}</span>,
    },
    {
      key: "clinicianName",
      label: "Clinician",
      render: (c) => <span className="text-sm">{c.clinician?.name || "Unassigned"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: "fee",
      label: "Fee",
      render: (c) => <span className="text-sm font-medium">KES {c.fee}</span>,
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (c) => <span className="text-xs text-neutral-500">{format(new Date(c.createdAt), "MMM d, h:mm a")}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (c) => (
        <div className="flex items-center gap-1.5">
          {c.status === "paid" && !c.clinicianId && c.paidAt && (
            <div className="flex items-center gap-1.5">
              <select
                aria-label={`Choose clinician for ${c.title}`}
                value={selectedClinicians[c.id] || ""}
                onChange={(event) => setSelectedClinicians((current) => ({ ...current, [c.id]: event.target.value }))}
                className="max-w-40 rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-primary"
              >
                <option value="">Choose clinician</option>
                {approvedClinicians.map((clinician) => <option key={clinician.id} value={clinician.id}>{clinician.name}</option>)}
              </select>
              <button
                onClick={() => handleAssign(c)}
                disabled={!selectedClinicians[c.id] || assigningId !== null}
                className="rounded-lg bg-brand px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-50"
              >
                {assigningId === c.id ? "Assigning..." : "Assign"}
              </button>
            </div>
          )}
          <button onClick={() => setDetailCon(detailCon?.id === c.id ? null : c)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-brand hover:bg-brand/5 transition-colors" title="View">
            <IconEye size={16} />
          </button>
          {c.status !== "closed" && c.status !== "completed" && (
            <button onClick={() => setConfirmState({ action: "cancel", id: c.id })}
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Cancel">
              <IconX size={16} />
            </button>
          )}
          {c.status === "completed" && (
            <button onClick={() => setConfirmState({ action: "close", id: c.id })}
              className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors" title="Close">
              <IconCheck size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader title="Consultations" description="Manage all platform consultations" />

      <DashboardShell>
        {assignmentError && <p role="alert" className="text-sm text-red-600">{assignmentError}</p>}
        {consultations.every((c) => !(c.status === "paid" && !c.clinicianId && c.paidAt)) && (
          <p className="text-sm text-neutral-500">No unassigned paid consultations.</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2">
          {statusLabels.map((s) => (
            <div key={s} className="bg-white border border-border rounded-xl p-3 text-center shadow-sm">
              <p className="text-xs text-neutral-500 capitalize truncate">{s.replace(/_/g, " ")}</p>
              <p className="text-lg font-bold text-primary">{statusCounts[s] || 0}</p>
            </div>
          ))}
          <div className="bg-white border border-border rounded-xl p-3 text-center shadow-sm">
            <p className="text-xs text-neutral-500 truncate">Unassigned</p>
            <p className="text-lg font-bold text-primary">{unassignedPaidCount}</p>
          </div>
        </div>

        <ActivityCard
          title="All Consultations"
          action={
            <div className="flex items-center gap-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-2 focus:ring-brand/20">
                <option value="all">All Status</option>
                {statusLabels.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
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
            emptyMessage="No consultations found" emptyIcon={<IconMessageChatbot size={40} stroke={1.5} />} />
        </ActivityCard>

        {detailCon && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
            <div className="fixed inset-0 bg-black/30" onClick={() => setDetailCon(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl border border-border w-full max-w-lg mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-primary font-primary">{detailCon.title}</h3>
                <button onClick={() => setDetailCon(null)} className="text-sm text-neutral-400 hover:text-primary">Close</button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-neutral-500">Type</span><span className="font-medium capitalize">{detailCon.consultationType}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Status</span><StatusBadge status={detailCon.status} /></div>
                <div className="flex justify-between"><span className="text-neutral-500">Patient</span><span>{detailCon.patient?.name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Clinician</span><span>{detailCon.clinician?.name || "Unassigned"}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Fee</span><span>${detailCon.fee}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Symptoms</span><span>{detailCon.symptoms || "None"}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Created</span><span>{format(new Date(detailCon.createdAt), "MMM d, yyyy h:mm a")}</span></div>
              </div>
            </div>
          </div>
        )}
      </DashboardShell>

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.action === "cancel" ? "Cancel Consultation" : "Close Consultation"}
        message={confirmState?.action === "cancel"
          ? "Are you sure you want to cancel this consultation? This action cannot be undone."
          : "Close this completed consultation?"}
        variant={confirmState?.action === "cancel" ? "danger" : "default"}
        confirmLabel={confirmState?.action === "cancel" ? "Cancel Consultation" : "Close"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState(null)}
        loading={acting}
      />
    </AuthGuard>
  );
}
