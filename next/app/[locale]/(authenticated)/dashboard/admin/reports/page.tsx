"use client";

import { useState, useCallback } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell, ContentGrid } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { DataTable, type Column } from "@/components/admin/DataTable";
import {
  IconReport, IconDownload, IconUsers, IconMessageChatbot,
  IconCurrencyDollar, IconShoppingCart,
} from "@tabler/icons-react";
import { getReportData, generateCSV } from "@/lib/actions/admin";

export default function ReportsPage() {
  return <ReportsClient />;
}

function ReportsClient() {
  const [reportType, setReportType] = useState("users");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReportData(reportType, fromDate || undefined, toDate || undefined);
      setRows(res.rows);
      setTotal(res.total);
    } catch {}
    setLoading(false);
  }, [reportType, fromDate, toDate]);

  const handleExport = async () => {
    const csv = await generateCSV(reportType);
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reportMeta: Record<string, { label: string; icon: React.ReactNode }> = {
    users: { label: "Users", icon: <IconUsers size={20} /> },
    consultations: { label: "Consultations", icon: <IconMessageChatbot size={20} /> },
    revenue: { label: "Revenue", icon: <IconCurrencyDollar size={20} /> },
  };

  const columns: Column<any>[] = [
    { key: "date", label: "Date", render: (r) => <span className="text-sm">{r.date}</span> },
    {
      key: reportType === "revenue" ? "total" : "count",
      label: reportType === "revenue" ? "Total (KES)" : "Count",
      render: (r) => <span className="font-medium">{reportType === "revenue" ? `KES ${Number(r.total).toFixed(2)}` : r.count}</span>,
    },
  ];

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader title="Reports" description="Generate and export platform reports" />

      <DashboardShell>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(reportMeta).map(([key, meta]) => (
            <button key={key} onClick={() => setReportType(key)}
              className={`p-5 rounded-2xl border text-left transition-all ${
                reportType === key
                  ? "bg-brand/5 border-brand text-brand"
                  : "bg-white border-border text-primary hover:border-brand/20"
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  reportType === key ? "bg-brand/10 text-brand" : "bg-neutral-50 text-neutral-400"
                }`}>{meta.icon}</div>
                <p className="font-semibold">{meta.label}</p>
              </div>
            </button>
          ))}
        </div>

        <ActivityCard title="Filters & Export">
          <div className="flex items-center gap-4 flex-wrap mb-6">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-2 focus:ring-brand/20" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-2 focus:ring-brand/20" />
            </div>
            <button onClick={fetchReport}
              className="px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors mt-4">
              {loading ? "..." : "Generate"}
            </button>
            <button onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand bg-brand/5 hover:bg-brand/10 rounded-xl transition-colors mt-4">
              <IconDownload size={16} /> Export CSV
            </button>
          </div>

          {rows.length > 0 && (
            <div>
              <p className="text-sm text-neutral-500 mb-2">Total: <span className="font-bold text-primary">{reportType === "revenue" ? `KES ${total.toFixed(2)}` : total}</span></p>
              <DataTable columns={columns} data={rows} keyField="date" />
            </div>
          )}
          {!loading && rows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
              <IconReport size={40} stroke={1.5} />
              <p className="mt-2 text-sm text-neutral-500">Generate a report to see data</p>
            </div>
          )}
        </ActivityCard>
      </DashboardShell>
    </AuthGuard>
  );
}
