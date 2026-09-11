import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { getOrderStats } from "@/lib/actions/admin";
import {
  IconPackage, IconShoppingCart, IconCurrencyDollar, IconDownload,
  IconExternalLink,
} from "@tabler/icons-react";
import { AdminProductsClient } from "./client";

export default async function ProductsPage() {
  const stats = await getOrderStats();
  return <AdminProductsClient stats={stats} />;
}
