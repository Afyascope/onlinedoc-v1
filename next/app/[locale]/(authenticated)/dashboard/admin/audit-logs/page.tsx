"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { IconHistory, IconSearch } from "@tabler/icons-react";
import { format } from "date-fns";
import { getAuditLogs, getAuditActions } from "@/lib/actions/admin";

export default function AuditLogsPage() {
  return <AuditLogsClient />;
}

function AuditLogsClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await getAuditLogs(p, 50, { action: actionFilter !== "all" ? actionFilter : undefined });
      setLogs(res.logs);
      setTotal(res.total);
    } catch {}
    setLoading(false);
  }, [actionFilter]);

  useEffect(() => { fetch(page); }, [page, fetch]);

  useEffect(() => {
    getAuditActions().then(setActions).catch(() => {});
  }, []);

  const columns: Column<any>[] = [
    {
      key: "action",
      label: "Action",
      render: (l) => (
        <span className="text-sm font-medium capitalize text-primary">{l.action.replace(/_/g, " ")}</span>
      ),
    },
    {
      key: "actor",
      label: "User",
      render: (l) => <span className="text-sm">{l.actor?.name || l.userId?.slice(0, 8) || "System"}</span>,
    },
    {
      key: "target",
      label: "Target",
      render: (l) => <span className="text-xs text-neutral-500">{l.target || "—"} {l.targetId ? `(${l.targetId.slice(0, 8)}...)` : ""}</span>,
    },
    {
      key: "ip",
      label: "IP",
      render: (l) => <span className="text-xs text-neutral-400 font-mono">{l.ip || "—"}</span>,
    },
    {
      key: "createdAt",
      label: "Timestamp",
      sortable: true,
      render: (l) => <span className="text-xs text-neutral-500">{format(new Date(l.createdAt), "MMM d, yyyy h:mm a")}</span>,
    },
  ];

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader title="Audit Logs" description="Track all platform changes" />

      <DashboardShell>
        <ActivityCard
          title="Audit Trail"
          action={
            <div className="flex items-center gap-2">
              <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 max-w-[200px]">
                <option value="all">All Actions</option>
                {actions.map((a) => (
                  <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          }
        >
          <DataTable columns={columns} data={logs} keyField="id"
            loading={loading} page={page} total={total} pageSize={50}
            onPageChange={setPage}
            emptyMessage="No audit logs found" emptyIcon={<IconHistory size={40} stroke={1.5} />} />
        </ActivityCard>
      </DashboardShell>
    </AuthGuard>
  );
}
