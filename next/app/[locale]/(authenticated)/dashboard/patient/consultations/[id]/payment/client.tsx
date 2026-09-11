"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { ConsultationStatusBadge } from "@/components/consultations/ConsultationStatusBadge";
import {
  initiateConsultationPayment,
  verifyConsultationPayment,
} from "@/lib/actions/payments";
import { usePaystackPopup } from "@/hooks/usePaystackPopup";
import {
  IconCurrencyDollar,
  IconLock,
  IconShield,
  IconBrandPaypal,
  IconBuildingBank,
  IconDeviceMobile,
} from "@tabler/icons-react";

interface Consultation {
  id: string;
  title: string;
  consultationType: string;
  status: string;
  fee: string;
  paystackReference: string | null;
}

const paymentMethods = [
  {
    id: "card",
    label: "Card Payment",
    desc: "Visa, Mastercard, Verve",
    icon: IconBrandPaypal,
  },
  {
    id: "bank",
    label: "Bank Transfer",
    desc: "Pay with Internet Banking",
    icon: IconBuildingBank,
  },
  {
    id: "mpesa",
    label: "M-Pesa",
    desc: "Mobile Money (Kenya)",
    icon: IconDeviceMobile,
  },
];

export function PaymentGateClient({ consultation: c }: { consultation: Consultation }) {
  const router = useRouter();
  const { loaded: paystackLoaded, payWithPopup } = usePaystackPopup();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState("card");
  const [phone, setPhone] = useState("");

  const handlePaymentSuccess = useCallback(async (reference: string) => {
    const result = await verifyConsultationPayment(c.id);
    if (result.success) {
      router.push(`/dashboard/patient/consultations/${c.id}?payment=success`);
    } else {
      setError("Payment verification failed. Contact support.");
      setProcessing(false);
    }
  }, [c.id, router]);

  const handlePay = async () => {
    if (!paystackLoaded) {
      setError("Payment system loading. Please try again.");
      return;
    }

    setProcessing(true);
    setError("");

    const result = await initiateConsultationPayment(c.id, method, method === "mpesa" ? phone : undefined);

    if (!result.success) {
      setError(result.error || "Payment initiation failed");
      setProcessing(false);
      return;
    }

    if (result.accessCode) {
      payWithPopup(result.accessCode, {
        onSuccess: (tx) => {
          handlePaymentSuccess(tx.reference);
        },
        onCancel: () => {
          setError("Payment cancelled.");
          setProcessing(false);
        },
      });
    } else if (result.url) {
      window.location.href = result.url;
    }
  };

  if (c.status !== "draft" && c.status !== "awaiting_payment") {
    return (
      <AuthGuard allowedRoles={["patient"]}>
        <DashboardHeader title="Payment" />
        <DashboardShell>
          <div className="text-center py-12">
            <p className="text-neutral-500">Payment is not required for this consultation.</p>
            <button
              onClick={() => router.push(`/dashboard/patient/consultations/${c.id}`)}
              className="mt-4 text-brand text-sm font-medium"
            >
              Back to Consultation
            </button>
          </div>
        </DashboardShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["patient"]}>
      <DashboardHeader
        title="Complete Payment"
        description="Pay to unlock your consultation"
      />
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

              <div>
                <p className="text-xs font-semibold text-neutral-600 mb-2">
                  Select Payment Method
                </p>
                <div className="space-y-2">
                  {paymentMethods.map((pm) => {
                    const Icon = pm.icon;
                    return (
                      <button
                        key={pm.id}
                        onClick={() => setMethod(pm.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          method === pm.id
                            ? "border-brand bg-brand/5"
                            : "border-border hover:border-neutral-300"
                        }`}
                      >
                        <Icon
                          size={20}
                          className={
                            method === pm.id ? "text-brand" : "text-neutral-400"
                          }
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-primary">
                            {pm.label}
                          </p>
                          <p className="text-xs text-neutral-500">{pm.desc}</p>
                        </div>
                        {method === pm.id && (
                          <div className="w-4 h-4 rounded-full border-2 border-brand flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-brand" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {method === "mpesa" && (
                <div>
                  <label className="text-xs font-semibold text-neutral-600">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 254712345678"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-neutral-600">Consultation Fee</span>
                <span className="text-lg font-bold text-primary">KES {c.fee}</span>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 text-amber-800 text-xs">
                <IconLock size={14} className="shrink-0" />
                <p>
                  Your consultation will be unlocked immediately after payment.
                </p>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                onClick={handlePay}
                disabled={processing || !paystackLoaded}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-50"
              >
                <IconCurrencyDollar size={18} />
                {!paystackLoaded
                  ? "Loading..."
                  : processing
                    ? "Processing..."
                    : `Pay KES ${c.fee} via ${method === "mpesa" ? "M-Pesa" : method === "bank" ? "Bank Transfer" : "Card"}`}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
                <IconShield size={14} />
                Secured by Paystack
              </div>
            </div>
          </ActivityCard>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
