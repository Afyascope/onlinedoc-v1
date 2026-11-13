"use client";

import { IconDownload } from "@tabler/icons-react";
import { useAuthRequired } from "@/hooks/useAuthRequired";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";

interface Props {
  orderItemId: string;
  className?: string;
}

export function DownloadButton({ orderItemId, className = "" }: Props) {
  const {
    authDialogOpen,
    redirectTo,
    requireAuth,
    closeAuthDialog,
  } = useAuthRequired();
  const href = `/api/download/${orderItemId}`;

  const handleClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    const returnTo = `${window.location.pathname}${window.location.search}`;
    const authenticated = await requireAuth(returnTo);
    if (authenticated) window.location.assign(href);
  };

  return (
    <>
      <a
        href={href}
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand/10 text-brand font-medium text-sm hover:bg-brand/20 transition-all ${className}`}
      >
        <IconDownload size={16} />
        Download
      </a>
      <AuthRequiredDialog
        open={authDialogOpen}
        redirectTo={redirectTo}
        onClose={closeAuthDialog}
      />
    </>
  );
}
