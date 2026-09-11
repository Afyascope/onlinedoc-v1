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
  IconShoppingCart, IconSearch, IconRefresh, IconDownload,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { refundOrder } from "@/lib/actions/admin";

const initialOrders: any[] = [];

export default function OrdersPage() {
  return <OrdersClient />;
}

function OrdersClient() {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [confirmState, setConfirmState] = useState<{ orderId: string } | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const mod = await import("@/lib/actions/admin");
      const res = await mod.getOrders(p, 25);
      setOrders(res.orders as any);
      setTotal(res.total);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(1); }, [fetchOrders]);

  const handleRefund = useCallback(async () => {
    if (!confirmState) return;
    await refundOrder(confirmState.orderId);
    setOrders((prev) => prev.map((o) => o.id === confirmState.orderId ? { ...o, paymentStatus: "refunded" } : o));
    setConfirmState(null);
  }, [confirmState]);

  const filtered = orders.filter((o) => {
    const matchesSearch = !search ||
      o.id?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: Column<any>[] = [
    {
      key: "id",
      label: "Order ID",
      render: (o) => <span className="text-xs font-mono text-neutral-500">{o.id.slice(0, 12)}...</span>,
    },
    {
      key: "userName",
      label: "Customer",
      render: (o) => <span className="text-sm font-medium">{o.user?.name || "—"}</span>,
    },
    {
      key: "totalAmount",
      label: "Amount",
      sortable: true,
      render: (o) => <span className="font-medium">KES {o.totalAmount}</span>,
    },
    {
      key: "paymentStatus",
      label: "Status",
      render: (o) => <StatusBadge status={o.paymentStatus || "pending"} />,
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (o) => <span className="text-xs text-neutral-500">{format(new Date(o.createdAt), "MMM d, yyyy")}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (o) => (
        <div className="flex gap-1.5">
          {o.paymentStatus === "paid" && (
            <button onClick={() => setConfirmState({ orderId: o.id })}
              className="px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
              Refund
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader title="Orders" description="Manage all product orders" />

      <DashboardShell>
        <ActivityCard
          title="All Orders"
          action={
            <div className="flex items-center gap-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-2 focus:ring-brand/20">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
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
            loading={loading} page={page} total={total} pageSize={25}
            onPageChange={(p) => { setPage(p); fetchOrders(p); }}
            emptyMessage="No orders found" emptyIcon={<IconShoppingCart size={40} stroke={1.5} />} />
        </ActivityCard>
      </DashboardShell>

      <ConfirmDialog
        open={!!confirmState}
        title="Refund Order"
        message="Refund this order? The amount will be returned to the customer."
        variant="warning"
        confirmLabel="Refund"
        onConfirm={handleRefund}
        onCancel={() => setConfirmState(null)}
      />
    </AuthGuard>
  );
}
