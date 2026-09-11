"use client";

import { useState, useEffect } from "react";
import { listDownloads } from "@/lib/actions/downloads";
import { verifyProductPayment } from "@/lib/actions/orders";
import { DownloadButton } from "@/components/marketplace/DownloadButton";
import { EmptyLibrary } from "@/components/marketplace/EmptyLibrary";
import { IconDownload, IconCircleCheck, IconClock, IconCircleX } from "@tabler/icons-react";

interface LibraryItem {
  downloadId: string;
  orderItemId: string;
  downloadCount: number;
  lastDownloadedAt: Date | null;
  productId: string;
  productName: string;
  productSlug: string;
  orderId: string;
  createdAt: Date;
}

type VerifyStatus = "success" | "pending" | "failed" | "cancelled";

const statusConfig: Record<VerifyStatus, { icon: React.ReactNode; title: string; body: string; className: string }> = {
  success: {
    icon: <IconCircleCheck size={20} className="text-green-600" />,
    title: "Payment successful",
    body: "Your product is now available in your library.",
    className: "bg-green-50 border-green-200",
  },
  pending: {
    icon: <IconClock size={20} className="text-amber-600" />,
    title: "Payment is being confirmed",
    body: "Your download will appear once payment is confirmed.",
    className: "bg-amber-50 border-amber-200",
  },
  failed: {
    icon: <IconCircleX size={20} className="text-red-600" />,
    title: "Payment was not completed",
    body: "Please try again.",
    className: "bg-red-50 border-red-200",
  },
  cancelled: {
    icon: <IconCircleX size={20} className="text-neutral-500" />,
    title: "Payment was cancelled",
    body: "",
    className: "bg-neutral-50 border-neutral-200",
  },
};

export function LibraryClient({ verifyRef }: { verifyRef?: string }) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus | null>(null);

  const refresh = () =>
    listDownloads()
      .then((list) => setItems(list as unknown as LibraryItem[]))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (verifyRef) {
      verifyProductPayment(verifyRef)
        .then((res) => {
          const s = res?.status;
          if (s === "paid") setVerifyStatus("success");
          else if (s === "pending") setVerifyStatus("pending");
          else if (s === "cancelled") setVerifyStatus("cancelled");
          else setVerifyStatus("failed");
        })
        .catch(() => setVerifyStatus("failed"))
        .finally(refresh);
    } else {
      refresh();
    }
  }, [verifyRef]);

  if (loading) return <div className="text-center py-8 text-neutral-400">Loading...</div>;

  const banner = verifyStatus ? statusConfig[verifyStatus] : null;

  return (
    <div className="space-y-4">
      {banner && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${banner.className}`}>
          {banner.icon}
          <div>
            <p className="text-sm font-semibold text-primary">{banner.title}</p>
            {banner.body && <p className="text-xs text-neutral-600 mt-0.5">{banner.body}</p>}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyLibrary />
      ) : (
        items.map((item) => (
          <div key={item.downloadId} className="bg-white border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
              <IconDownload size={20} className="text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary">{item.productName}</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Purchased {new Date(item.createdAt).toLocaleDateString()} &middot; Downloaded {item.downloadCount} time{item.downloadCount !== 1 ? "s" : ""}
              </p>
            </div>
            <a
              href={`/products/${item.productSlug}`}
              className="text-xs text-brand hover:text-brand-hover font-medium"
            >
              View Product
            </a>
            <DownloadButton orderItemId={item.orderItemId} />
          </div>
        ))
      )}
    </div>
  );
}
