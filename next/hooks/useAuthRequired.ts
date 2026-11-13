"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/context/auth-context";

function currentPath(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

export function useAuthRequired() {
  const { refresh } = useAuth();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const showAuthRequired = useCallback((target?: string) => {
    setRedirectTo(target || currentPath());
  }, []);

  const requireAuth = useCallback(
    async (target?: string) => {
      setIsCheckingAuth(true);
      try {
        const session = await refresh();
        if (session?.user) return true;
        setRedirectTo(target || currentPath());
        return false;
      } finally {
        setIsCheckingAuth(false);
      }
    },
    [refresh],
  );

  const closeAuthDialog = useCallback(() => {
    setRedirectTo(null);
  }, []);

  return {
    authDialogOpen: redirectTo !== null,
    redirectTo: redirectTo ?? "",
    isCheckingAuth,
    requireAuth,
    showAuthRequired,
    closeAuthDialog,
  };
}
