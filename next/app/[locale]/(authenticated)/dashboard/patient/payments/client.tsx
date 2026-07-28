"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell, MetricGrid } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { IconCreditCard, IconCurrencyDollar } from "@tabler/icons-react";
import { format } from "date-fns";

interface Payment {
  id: string;
  amount: string;
  currency: string;
  status: string;
  method: string | null;
  description: string | null;
  invoiceNumber: string | null;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  completed: "bg-green-50 text-green-700",
  refunded: "bg-blue-50 text-blue-700",
  failed: "bg-red-50 text-red-600",
};

export function PatientPaymentsClient({ payments: list }: { payments: Payment[] }) {
  const totalPaid = list.filter((p) => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingAmount = list.filter((p) => p.status === "pending").reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <AuthGuard allowedRoles={["patient"]}>
      <DashboardHeader
        title="Payments"
        description="View your billing history and invoices"
      />

      <DashboardShell>
        <MetricGrid columns={2}>
          <MetricCard
            title="Total Paid"
            value={`$${totalPaid.toFixed(2)}`}
            icon={<IconCurrencyDollar size={20} />}
          />
          <MetricCard
            title="Pending"
            value={`$${pendingAmount.toFixed(2)}`}
            icon={<IconCreditCard size={20} />}
          />
        </MetricGrid>

        <ActivityCard title="Billing History">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <IconCreditCard size={40} stroke={1.5} />
              <p className="mt-3 text-sm text-neutral-500 font-secondary">No payment history</p>
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-brand/20 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-primary">{p.description || "Payment"}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {p.invoiceNumber && `${p.invoiceNumber} · `}
                      {format(new Date(p.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      ${Number(p.amount).toFixed(2)}
                    </p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[p.status] || "bg-neutral-100 text-neutral-600"}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ActivityCard>
      </DashboardShell>
    </AuthGuard>
  );
}
