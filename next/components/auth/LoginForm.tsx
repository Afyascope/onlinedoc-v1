"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Container } from "@/components/container";
import { Link } from "next-view-transitions";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard/patient";
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(email, password, rememberMe);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push(redirectTo);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <Container className="max-w-md w-full">
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary font-primary">
              Welcome back
            </h1>
            <p className="text-neutral-600 mt-2 text-sm font-secondary">
              Sign in to your OnlineDoc account
            </p>
          </div>

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
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-primary mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-border text-primary placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all text-sm"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
                <span className="text-sm text-neutral-600 font-secondary">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-brand hover:text-brand-hover font-medium"
              >
                Forgot password?
              </Link>
            </div>

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
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-600 mt-6 font-secondary">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand hover:text-brand-hover font-medium">
              Create one
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}