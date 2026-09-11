"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell, MetricGrid } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { DataTable, type Column } from "@/components/admin/DataTable";
import {
  IconPackage, IconShoppingCart, IconCurrencyDollar, IconDownload,
  IconExternalLink, IconBox,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { apiUrl } from "@/lib/config";

export function AdminProductsClient({ stats }: { stats: any }) {
  const strapiUrl = apiUrl();

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader title="Marketplace" description="Manage product sales and orders" />

      <DashboardShell>
        <MetricGrid columns={4}>
          <MetricCard title="Total Orders" value={stats.totalOrders.toLocaleString()} icon={<IconShoppingCart size={20} />} />
          <MetricCard title="Paid Orders" value={stats.paidOrders.toLocaleString()} icon={<IconPackage size={20} />} />
          <MetricCard title="Revenue" value={`KES ${stats.totalRevenue.toLocaleString()}`} icon={<IconCurrencyDollar size={20} />} />
          <MetricCard title="Downloads" value={stats.totalDownloads.toLocaleString()} icon={<IconDownload size={20} />} />
        </MetricGrid>

        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
            <IconBox size={40} stroke={1.5} />
            <p className="mt-4 text-sm text-neutral-500 font-secondary text-center max-w-md">
              Product catalog editing is managed through Strapi CMS.
            </p>
            <a href={`${strapiUrl}/admin`} target="_blank" rel="noopener noreferrer"
              className="mt-4 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand bg-brand/5 hover:bg-brand/10 rounded-xl transition-colors">
              Open Strapi Admin <IconExternalLink size={16} />
            </a>
          </div>
        </div>

        <ActivityCard title="Recent Orders">
          {stats.recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
              <IconShoppingCart size={32} stroke={1.5} />
              <p className="mt-2 text-sm text-neutral-500">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase">Order</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase">Amount</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase">Status</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((o: any) => (
                    <tr key={o.id} className="border-b border-border last:border-0 hover:bg-neutral-50">
                      <td className="py-3 px-2 font-medium text-primary">{o.id.slice(0, 8)}...</td>
                      <td className="py-3 px-2">KES {o.totalAmount}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          o.paymentStatus === "paid" || o.paymentStatus === "completed" ? "bg-green-50 text-green-700"
                          : o.paymentStatus === "pending" ? "bg-amber-50 text-amber-700"
                          : o.paymentStatus === "refunded" ? "bg-orange-50 text-orange-700"
                          : "bg-red-50 text-red-700"
                        }`}>{o.paymentStatus}</span>
                      </td>
                      <td className="py-3 px-2 text-xs text-neutral-500">{format(new Date(o.createdAt), "MMM d")}</td>
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
