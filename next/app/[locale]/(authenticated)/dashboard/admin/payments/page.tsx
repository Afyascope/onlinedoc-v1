"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MetricGrid } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { IconCreditCard, IconSearch } from "@tabler/icons-react";
import { format } from "date-fns";
import { getPayments } from "@/lib/actions/admin";

export default function PaymentsPage() {
  return <PaymentsClient />;
}

function PaymentsClient() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await getPayments(p, 25);
      setPayments(res.payments);
      setTotal(res.total);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetch(page); }, [page, fetch]);

  const columns: Column<any>[] = [
    { key: "id", label: "ID", render: (p) => <span className="text-xs font-mono text-neutral-500">{p.id.slice(0, 12)}...</span> },
    { key: "amount", label: "Amount", sortable: true, render: (p) => <span className="font-medium">KES {p.amount}</span> },
    { key: "status", label: "Status", render: (p) => <StatusBadge status={p.status} /> },
    { key: "method", label: "Method", render: (p) => <span className="text-sm capitalize">{p.method || "—"}</span> },
    { key: "createdAt", label: "Date", sortable: true, render: (p) => <span className="text-xs text-neutral-500">{format(new Date(p.createdAt), "MMM d, yyyy")}</span> },
  ];

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader title="Payments" description="View all payment transactions" />
      <DashboardShell>
        <ActivityCard title="All Payments">
          <DataTable columns={columns} data={payments} keyField="id"
            loading={loading} page={page} total={total} pageSize={25}
            onPageChange={setPage}
            emptyMessage="No payments found" emptyIcon={<IconCreditCard size={40} stroke={1.5} />} />
        </ActivityCard>
      </DashboardShell>
    </AuthGuard>
  );
}
