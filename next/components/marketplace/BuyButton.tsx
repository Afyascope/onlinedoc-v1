"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initiateProductPayment } from "@/lib/actions/orders";
import { IconShoppingCart } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useAuthRequired } from "@/hooks/useAuthRequired";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";

interface Props {
  productSlug: string;
  price?: string | number;
  hasFile?: boolean;
  className?: string;
}

function isUnauthenticated(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const digest = (error as Error & { digest?: string }).digest;
  return error.message === "Not authenticated" || Boolean(digest?.includes("Not authenticated"));
}

export function BuyButton({ productSlug, price = 0, hasFile = true, className = "" }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const {
    authDialogOpen,
    redirectTo,
    isCheckingAuth,
    requireAuth,
    showAuthRequired,
    closeAuthDialog,
  } = useAuthRequired();
  const isFree = Number(price) === 0;
  const isBusy = loading || isCheckingAuth;

  const handleBuy = async () => {
    setErrorMessage("");
    const returnTo = `${window.location.pathname}${window.location.search}`;
    const authenticated = await requireAuth(returnTo);
    if (!authenticated) return;

    setLoading(true);
    try {
      const result = await initiateProductPayment(productSlug);

      if (result.success && result.url) {
        window.location.href = result.url;
      } else if (result.success && result.free) {
        router.push("/dashboard/patient/library");
      } else if (!result.success && "code" in result && result.code === "UNAUTHENTICATED") {
        showAuthRequired(returnTo);
      } else if (!result.success) {
        setErrorMessage(result.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      if (isUnauthenticated(error)) {
        showAuthRequired(returnTo);
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
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
    <>
      <button
        onClick={handleBuy}
        disabled={isBusy}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          className
        )}
      >
        <IconShoppingCart size={18} />
        {isBusy ? "Processing..." : isFree ? "Get for Free" : "Buy Now"}
      </button>
      {errorMessage ? (
        <p role="alert" className="mt-2 font-secondary text-xs text-error">
          {errorMessage}
        </p>
      ) : null}
      <AuthRequiredDialog
        open={authDialogOpen}
        redirectTo={redirectTo}
        onClose={closeAuthDialog}
      />
    </>
  );
}
