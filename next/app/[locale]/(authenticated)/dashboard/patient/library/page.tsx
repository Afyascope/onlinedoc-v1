import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LibraryClient } from "./client";

export default function LibraryPage({
  searchParams,
}: {
  searchParams: { reference?: string; trxref?: string };
}) {
  const verifyRef = searchParams?.reference || searchParams?.trxref;

  return (
    <AuthGuard allowedRoles={["patient"]}>
      <DashboardHeader title="Download Library" description="Your purchased digital products" />
      <DashboardShell>
        <LibraryClient verifyRef={verifyRef} />
      </DashboardShell>
    </AuthGuard>
  );
}
