"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    try {
      const { authClient } = await import("@/lib/auth-client");
      await authClient.sendVerificationEmail({ email: user.email });
      setSent(true);
    } catch {
      // silently fail - banner will still show
    }
    setSending(false);
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <p className="text-amber-800 text-sm font-secondary">
          Please verify your email address to access all features.
        </p>
        {sent ? (
          <span className="text-amber-700 text-sm font-medium whitespace-nowrap">
            Email sent
          </span>
        ) : (
          <button
            onClick={handleResend}
            disabled={sending}
            className="text-amber-700 hover:text-amber-900 text-sm font-medium underline whitespace-nowrap disabled:opacity-50"
          >
            {sending ? "Sending..." : "Resend email"}
          </button>
        )}
      </div>
    </div>
  );
}