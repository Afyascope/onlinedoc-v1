"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Container } from "@/components/container";
import { Link } from "next-view-transitions";
import type { UserRole } from "@/types/auth";

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("patient");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Full name is required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!acceptedTerms) {
      setError("You must accept the Terms and Conditions");
      return;
    }

    setIsLoading(true);

    const result = await register(name, email, password, role);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <Container className="max-w-md w-full">
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm text-center">
            <div className="h-12 w-12 rounded-full bg-[#E0FCFF] border border-brand flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-primary font-primary mb-2">
              Account created
            </h1>
            <p className="text-neutral-600 font-secondary text-sm mb-6">
              {role === "clinician"
                ? "We sent a verification email. After verification, an administrator will review and approve your account."
                : "We sent a verification email. Please check your inbox to verify your email address."}
            </p>
            <Link
              href="/login"
              className="inline-block bg-brand text-white font-bold px-8 py-3 rounded-xl hover:bg-brand-hover transition-all text-sm"
            >
              Sign in
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-10">
      <Container className="max-w-md w-full">
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary font-primary">
              Create your account
            </h1>
            <p className="text-neutral-600 mt-2 text-sm font-secondary">
              Join OnlineDoc for trusted healthcare
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-primary mb-1">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-border text-primary placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all text-sm"
                placeholder="John Doe"
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-primary mb-1">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-border text-primary placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all text-sm"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-primary mb-1">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-border text-primary placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all text-sm"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-primary mb-1">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-border text-primary placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all text-sm"
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("patient")}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    role === "patient"
                      ? "border-brand bg-[#E0FCFF] text-primary"
                      : "border-border bg-white text-neutral-600 hover:border-neutral-300"
                  }`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole("clinician")}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    role === "clinician"
                      ? "border-brand bg-[#E0FCFF] text-primary"
                      : "border-border bg-white text-neutral-600 hover:border-neutral-300"
                  }`}
                >
                  Clinician
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded border-border text-brand focus:ring-brand"
              />
              <span className="text-sm text-neutral-600 font-secondary">
                I accept the{" "}
                <a href="/terms" className="text-brand hover:text-brand-hover underline">
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-brand hover:text-brand-hover underline">
                  Privacy Policy
                </a>
              </span>
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm font-secondary">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand text-white font-bold h-12 rounded-xl hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-600 mt-6 font-secondary">
            Already have an account?{" "}
            <Link href="/login" className="text-brand hover:text-brand-hover font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}