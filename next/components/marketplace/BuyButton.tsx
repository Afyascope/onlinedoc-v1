"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initiateProductPayment } from "@/lib/actions/orders";
import { IconShoppingCart } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface Props {
  productSlug: string;
  price?: string | number;
  hasFile?: boolean;
  className?: string;
}

export function BuyButton({ productSlug, price = 0, hasFile = true, className = "" }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isFree = Number(price) === 0;

  const handleBuy = async () => {
    setLoading(true);
    try {
      const result = await initiateProductPayment(productSlug);
      setLoading(false);

      if (result.success && result.url) {
        window.location.href = result.url;
      } else if (result.success && result.free) {
        router.push("/dashboard/patient/library");
      } else {
        alert(result.error || "Something went wrong");
      }
    } catch (e: any) {
      setLoading(false);
      if (e?.message === "Not authenticated" || e?.digest?.includes("Not authenticated")) {
        router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
      } else {
        alert(e?.message || "Something went wrong");
      }
    }
  };

  if (!hasFile) {
    return (
      <button
        disabled
        className={cn(
          "inline-flex items-center gap-2 rounded-xl bg-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-500 cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          className
        )}
      >
        <IconShoppingCart size={18} />
        Unavailable
      </button>
    );
  }

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        className
      )}
    >
      <IconShoppingCart size={18} />
      {loading ? "Processing..." : isFree ? "Get for Free" : "Buy Now"}
    </button>
  );
}
