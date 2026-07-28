"use client";

import { useAuth } from "@/context/auth-context";

export function ClinicianApprovalBanner() {
  const { user } = useAuth();

  if (!user || user.role !== "clinician" || user.clinicianApproved) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <p className="text-blue-800 text-sm font-secondary">
          Your account is pending administrator approval. You will receive an email once approved.
        </p>
      </div>
    </div>
  );
}