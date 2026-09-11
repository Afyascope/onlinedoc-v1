"use client";

import { useState, useEffect, useCallback, useRef } from "react";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface PaystackPopupOptions {
  onSuccess?: (transaction: { reference: string; trxref?: string }) => void;
  onCancel?: () => void;
}

export function usePaystackPopup() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.PaystackPop) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError("Failed to load Paystack");
    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        document.body.removeChild(scriptRef.current);
      }
    };
  }, []);

  const payWithPopup = useCallback(
    (accessCode: string, options?: PaystackPopupOptions) => {
      if (!window.PaystackPop) {
        setError("Paystack not loaded");
        return;
      }

      const popup = new window.PaystackPop();
      popup.resumeTransaction(accessCode, {
        onSuccess: (transaction: any) => {
          options?.onSuccess?.(transaction);
        },
        onCancel: () => {
          options?.onCancel?.();
        },
      });
    },
    []
  );

  return { loaded, error, payWithPopup };
}
