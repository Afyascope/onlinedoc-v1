import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { OrdersClient } from "./client";

export default function OrdersPage() {
  return (
    <AuthGuard allowedRoles={["patient"]}>
      <DashboardHeader title="My Orders" description="Your purchase history" />
      <DashboardShell>
        <OrdersClient />
      </DashboardShell>
    </AuthGuard>
  );
}
