"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell, ContentGrid } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import {
  IconChartBar, IconUsers, IconMessageChatbot,
  IconPackage, IconStethoscope, IconCreditCard,
} from "@tabler/icons-react";

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}

interface MonthlyData {
  month: string;
  count: number;
}

interface TopProduct {
  productId: string;
  productName: string | null;
  productSlug: string | null;
  totalSold: number;
  totalRevenue: number;
}

interface TopClinician {
  clinicianId: string;
  totalConsultations: number;
}

interface PaymentMethod {
  method: string | null;
  count: number;
  total: number;
}

function MiniBarChart({ data, label, color = "bg-brand" }: { data: MonthlyData[]; label: string; color?: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <p className="text-sm font-semibold text-primary mb-3">{label}</p>
      <div className="flex items-end gap-1.5 h-28">
        {data.map((d) => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-neutral-400 font-medium">{d.count}</span>
            <div
              className={`w-full rounded-t ${color}`}
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? "4px" : "0" }}
            />
            <span className="text-[10px] text-neutral-400">{d.month.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsClient() {
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<MonthlyData[]>([]);
  const [consultations, setConsultations] = useState<MonthlyData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topClinicians, setTopClinicians] = useState<TopClinician[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const mod = await import("@/lib/actions/admin");
      const [reg, cons, prods, clin, meth] = await Promise.all([
        mod.getMonthlyRegistrations(),
        mod.getMonthlyConsultations(),
        mod.getTopProducts(),
        mod.getTopClinicians(),
        mod.getPaymentMethodBreakdown(),
      ]);
      setRegistrations(reg as any);
      setConsultations(cons as any);
      setTopProducts(prods as any);
      setTopClinicians(clin as any);
      setPaymentMethods(meth as any);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <DashboardHeader title="Analytics" description="Platform growth and performance" />
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader title="Analytics" description="Platform growth and performance" />

      <DashboardShell>
        <ContentGrid columns={1}>
          <ActivityCard title="User Registrations (Monthly)">
            {registrations.length > 0
              ? <MiniBarChart data={registrations} label="" />
              : <p className="text-center text-neutral-400 py-8 text-sm">No registration data</p>}
          </ActivityCard>
        </ContentGrid>

        <ContentGrid>
          <ActivityCard title="Consultations (Monthly)">
            {consultations.length > 0
              ? <MiniBarChart data={consultations} label="" color="bg-cyan-500" />
              : <p className="text-center text-neutral-400 py-8 text-sm">No consultation data</p>}
          </ActivityCard>

          <ActivityCard title="Payment Methods">
            {paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.map((pm) => (
                  <div key={pm.method || "unknown"} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <IconCreditCard size={16} className="text-neutral-400" />
                      <span className="text-sm capitalize">{pm.method || "Unknown"}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{pm.count} txns</p>
                      <p className="text-xs text-neutral-500">KES {Number(pm.total).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-neutral-400 py-8 text-sm">No payment data</p>
            )}
          </ActivityCard>
        </ContentGrid>

        <ContentGrid>
          <ActivityCard title="Top Products">
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.productId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-300 w-5">{i + 1}</span>
                      <span className="text-sm">{p.productName || p.productSlug || "Unknown"}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{p.totalSold} sold</p>
                      <p className="text-xs text-neutral-500">KES {Number(p.totalRevenue).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-neutral-400 py-8 text-sm">No product sales data</p>
            )}
          </ActivityCard>

          <ActivityCard title="Top Clinicians">
            {topClinicians.length > 0 ? (
              <div className="space-y-3">
                {topClinicians.map((c, i) => (
                  <div key={c.clinicianId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-300 w-5">{i + 1}</span>
                      <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-semibold">
                        {c.clinicianId.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-neutral-500 font-mono text-xs">{c.clinicianId.slice(0, 8)}...</span>
                    </div>
                    <span className="text-sm font-medium">{c.totalConsultations} consults</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-neutral-400 py-8 text-sm">No clinician data</p>
            )}
          </ActivityCard>
        </ContentGrid>
      </DashboardShell>
    </AuthGuard>
  );
}
