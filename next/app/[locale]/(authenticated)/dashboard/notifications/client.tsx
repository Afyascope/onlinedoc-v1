"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { fetchNotifications, markAsRead, markAllAsRead } from "@/lib/actions/notifications";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { IconBell } from "@tabler/icons-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export function NotificationsListClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications(50).then((list) => {
      setNotifications(list);
      setLoading(false);
    });
  }, []);

  const handleClick = async (n: Notification) => {
    if (!n.readAt) {
      await markAsRead(n.id);
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, readAt: new Date() } : x));
    }
    if (n.link) router.push(n.link);
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
  };

  if (loading) return <div className="text-center py-8 text-neutral-400">Loading...</div>;

  return (
    <ActivityCard
      title="All Notifications"
      action={
        notifications.some((n) => !n.readAt) ? (
          <button onClick={handleMarkAll} className="text-xs font-medium text-brand hover:text-brand-hover">
            Mark all read
          </button>
        ) : undefined
      }
    >
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
          <IconBell size={48} stroke={1.5} />
          <p className="mt-4 text-sm text-neutral-500 font-secondary">No notifications yet</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={cn(
                "w-full text-left px-4 py-4 hover:bg-neutral-50 transition-colors flex items-start gap-3",
                !n.readAt && "bg-brand/5"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full mt-1.5 shrink-0",
                !n.readAt ? "bg-brand" : "bg-transparent"
              )} />
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", !n.readAt ? "font-semibold text-primary" : "font-medium text-neutral-600")}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="text-xs text-neutral-500 mt-0.5">{n.body}</p>
                )}
                <p className="text-[10px] text-neutral-400 mt-1">
                  {format(new Date(n.createdAt), "MMM d, yyyy HH:mm")}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </ActivityCard>
  );
}
