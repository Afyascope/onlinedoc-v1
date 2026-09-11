"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import type { UserRole } from "@/types/auth";
import { getClinicianStatus } from "@/lib/clinician-status";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredClinicianStatus?: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, allowedRoles, requiredClinicianStatus, fallback }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, role, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    const path = window.location.pathname;
    const status = user.role === "clinician" ? getClinicianStatus(user) : null;
    if (user.role === "clinician" && status !== "APPROVED") {
      const target = status === "REJECTED" ? "/dashboard/clinician/rejected" : "/dashboard/clinician/pending";
      if (!path.endsWith(target)) router.replace(target);
      return;
    }
    if (role === "clinician" && path.startsWith("/dashboard/patient")) router.replace("/dashboard/clinician");
    if (requiredClinicianStatus && status !== requiredClinicianStatus) {
      router.replace(status === "APPROVED" ? "/dashboard/clinician" : `/dashboard/clinician/${status?.toLowerCase() || "pending"}`);
      return;
    }
    if (role === "patient" && path.startsWith("/dashboard/clinician")) router.replace("/dashboard/patient");
    if (role === "admin" && !path.startsWith("/dashboard/admin")) router.replace("/dashboard/admin");
  }, [isLoading, isAuthenticated, user, role, requiredClinicianStatus, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="h-8 w-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary font-primary mb-2">Access denied</h1>
          <p className="text-neutral-600 font-secondary text-sm">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
