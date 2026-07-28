"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { ConsultationStatusBadge } from "@/components/consultations/ConsultationStatusBadge";
import { initiatePayment, verifyPayment } from "@/lib/actions/payments";
import { IconCurrencyDollar, IconLock, IconShield } from "@tabler/icons-react";

interface Consultation {
  id: string;
  title: string;
  consultationType: string;
  status: string;
  fee: string;
}

export function PaymentGateClient({ consultation: c }: { consultation: Consultation }) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    setProcessing(true);
    setError("");

    const result = await initiatePayment(c.id);

    if (result.error) {
      setError(result.error);
      setProcessing(false);
      return;
    }

    if (result.url) {
      window.location.href = result.url;
      return;
    }

    if (result.mockPayment) {
      await verifyPayment(c.id);
      router.push(`/dashboard/patient/consultations/${c.id}?payment=success`);
    }
  };

  if (c.status !== "draft" && c.status !== "awaiting_payment") {
    return (
      <AuthGuard allowedRoles={["patient"]}>
        <DashboardHeader title="Payment" />
        <DashboardShell>
          <div className="text-center py-12">
            <p className="text-neutral-500">Payment is not required for this consultation.</p>
            <button onClick={() => router.push(`/dashboard/patient/consultations/${c.id}`)} className="mt-4 text-brand text-sm font-medium">
              Back to Consultation
            </button>
          </div>
        </DashboardShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["patient"]}>
      <DashboardHeader title="Complete Payment" description="Pay to unlock your consultation" />

      <DashboardShell>
        <div className="max-w-lg mx-auto space-y-6">
          <ActivityCard title="Payment Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <p className="text-sm font-semibold text-primary">{c.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 capitalize">
                    {c.consultationType.replace("_", " ")}
                  </p>
                </div>
                <ConsultationStatusBadge status={c.status} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Consultation Fee</span>
                <span className="text-lg font-bold text-primary">${c.fee}</span>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 text-amber-800 text-xs">
                <IconLock size={14} className="shrink-0" />
                <p>Your WhatsApp consultation will be unlocked immediately after payment.</p>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button
                onClick={handlePay}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-50"
              >
                <IconCurrencyDollar size={18} />
                {processing ? "Processing..." : `Pay $${c.fee}`}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
                <IconShield size={14} />
                Secured by Stripe
              </div>
            </div>
          </ActivityCard>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
