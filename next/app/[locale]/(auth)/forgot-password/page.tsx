"use client";

import { useState } from "react";
import { Container } from "@/components/container";
import { Link } from "next-view-transitions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const { authClient } = await import("@/lib/auth-client");
      const { error: err } = await authClient.forgetPassword({ email });
      if (err) {
        setError(err.message || "Something went wrong");
        return;
      }
      setSent(true);
    } catch {
      setError("Failed to send reset email. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <Container className="max-w-md w-full">
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary font-primary">
              Forgot password
            </h1>
            <p className="text-neutral-600 mt-2 text-sm font-secondary">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-[#E0FCFF] border border-brand flex items-center justify-center mx-auto mb-4">
                <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-neutral-700 font-secondary text-sm">
                Check your email. We sent a reset link to <strong>{email}</strong>.
              </p>
              <Link
                href="/login"
                className="text-brand hover:text-brand-hover text-sm font-medium mt-4 inline-block"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-border text-primary placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all text-sm"
                  placeholder="you@example.com"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm font-secondary">{error}</p>
              )}

              <button
                type="submit"
                className="w-full bg-brand text-white font-bold h-12 rounded-xl hover:bg-brand-hover transition-all text-sm"
              >
                Send reset link
              </button>

              <p className="text-center text-sm text-neutral-600 font-secondary">
                Remember your password?{" "}
                <Link href="/login" className="text-brand hover:text-brand-hover font-medium">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </Container>
    </div>
  );
}
