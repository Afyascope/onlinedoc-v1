"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Container } from "@/components/container";
import { Link } from "next-view-transitions";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const { authClient } = await import("@/lib/auth-client");
      const { error: err } = await authClient.resetPassword({
        token,
        newPassword: password,
      });
      if (err) {
        setError(err.message || "Invalid or expired reset link");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Failed to reset password. Please try again.");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <Container className="max-w-md w-full text-center">
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-primary font-primary mb-4">Invalid link</h1>
            <p className="text-neutral-600 font-secondary text-sm mb-6">
              This password reset link is missing or invalid.
            </p>
            <Link href="/forgot-password" className="text-brand hover:text-brand-hover font-medium text-sm">
              Request a new reset link
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <Container className="max-w-md w-full">
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary font-primary">
              Reset your password
            </h1>
            <p className="text-neutral-600 mt-2 text-sm font-secondary">
              Enter your new password below.
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-[#E0FCFF] border border-brand flex items-center justify-center mx-auto mb-4">
                <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-neutral-700 font-secondary text-sm">
                Password reset successful! Redirecting to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-primary mb-1">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-border text-primary placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all text-sm"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-primary mb-1">
                  Confirm new password
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-border text-primary placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all text-sm"
                  placeholder="Repeat your password"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm font-secondary">{error}</p>
              )}

              <button
                type="submit"
                className="w-full bg-brand text-white font-bold h-12 rounded-xl hover:bg-brand-hover transition-all text-sm"
              >
                Reset password
              </button>
            </form>
          )}
        </div>
      </Container>
    </div>
  );
}
