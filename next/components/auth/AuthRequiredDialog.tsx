"use client";

import { useParams, useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface AuthRequiredDialogProps {
  open: boolean;
  redirectTo: string;
  onClose: () => void;
}

export function AuthRequiredDialog({ open, redirectTo, onClose }: AuthRequiredDialogProps) {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale ?? "en";
  const redirectQuery = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : "";

  const goToSignIn = () => {
    onClose();
    router.push(`/${locale}/login${redirectQuery}`);
  };

  const goToRegister = () => {
    onClose();
    router.push(`/${locale}/register${redirectQuery}`);
  };

  return (
    <ConfirmDialog
      open={open}
      title="Sign in required"
      message="Please sign in to download this product."
      confirmLabel="Sign in"
      cancelLabel="Create account"
      onConfirm={goToSignIn}
      onCancel={goToRegister}
      onDismiss={onClose}
    />
  );
}
