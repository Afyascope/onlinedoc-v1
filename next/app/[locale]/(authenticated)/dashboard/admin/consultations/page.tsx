import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getAllConsultations } from "@/lib/actions/admin";
import {
  IconMessageChatbot, IconSearch,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { ConsultationsClient } from "./client";

export default async function ConsultationsPage() {
  const data = await getAllConsultations(1, 100);
  return <ConsultationsClient initialConsultations={data.consultations} total={data.total} />;
}
