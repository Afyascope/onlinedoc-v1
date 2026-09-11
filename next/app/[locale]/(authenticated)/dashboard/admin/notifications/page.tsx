"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { IconBell, IconCheck, IconTrash } from "@tabler/icons-react";
import { format } from "date-fns";
import { getAllNotifications, markAllNotificationsRead } from "@/lib/actions/admin";

export default function NotificationsPage() {
  return <NotificationsClient />;
}

function NotificationsClient() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllNotifications(1, 50);
      setNotifications(res.notifications);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date() })));
  };

  const columns: Column<any>[] = [
    {
      key: "title",
      label: "Title",
      render: (n) => (
        <div>
          <p className={`font-medium ${!n.readAt ? "text-primary" : "text-neutral-500"}`}>{n.title}</p>
          {n.body && <p className="text-xs text-neutral-400">{n.body}</p>}
        </div>
      ),
    },
    { key: "type", label: "Type", render: (n) => <span className="text-xs capitalize text-neutral-500">{n.type.replace(/_/g, " ")}</span> },
    { key: "readAt", label: "Status", render: (n) => n.readAt ? <StatusBadge status="read" /> : <StatusBadge status="pending" /> },
    { key: "createdAt", label: "Date", render: (n) => <span className="text-xs text-neutral-500">{format(new Date(n.createdAt), "MMM d, h:mm a")}</span> },
  ];

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader title="Notifications" description="View all system notifications" />

      <DashboardShell>
        <ActivityCard
          title="All Notifications"
          action={
            <button onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand bg-brand/5 hover:bg-brand/10 rounded-xl transition-colors">
              <IconCheck size={16} /> Mark All Read
            </button>
          }
        >
          <DataTable columns={columns} data={notifications} keyField="id"
            loading={loading}
            emptyMessage="No notifications" emptyIcon={<IconBell size={40} stroke={1.5} />} />
        </ActivityCard>
      </DashboardShell>
    </AuthGuard>
  );
}
