"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/container";
import { Link } from "next-view-transitions";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    async function verify() {
      try {
        const { authClient } = await import("@/lib/auth-client");
        const { error: err } = await authClient.verifyEmail({ token });
        if (err) {
          setStatus("error");
          setMessage(err.message || "Verification failed. The link may have expired.");
          return;
        }
        setStatus("success");
        setMessage("Email verified successfully!");
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    }

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <Container className="max-w-md w-full">
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm text-center">
          {status === "verifying" && (
            <>
              <div className="h-12 w-12 rounded-full bg-neutral-100 animate-pulse mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-primary font-primary mb-2">
                Verifying your email
              </h1>
              <p className="text-neutral-600 font-secondary text-sm">
                Please wait...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="h-12 w-12 rounded-full bg-[#E0FCFF] border border-brand flex items-center justify-center mx-auto mb-4">
                <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-primary font-primary mb-2">
                Email verified
              </h1>
              <p className="text-neutral-600 font-secondary text-sm mb-6">
                {message}
              </p>
              <Link
                href="/login"
                className="inline-block bg-brand text-white font-bold px-8 py-3 rounded-xl hover:bg-brand-hover transition-all text-sm"
              >
                Sign in
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="h-12 w-12 rounded-full bg-red-100 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-primary font-primary mb-2">
                Verification failed
              </h1>
              <p className="text-neutral-600 font-secondary text-sm mb-6">
                {message}
              </p>
              <Link
                href="/login"
                className="text-brand hover:text-brand-hover font-medium text-sm"
              >
                Back to login
              </Link>
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
