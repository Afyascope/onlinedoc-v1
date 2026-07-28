"use client";

import { useState, useEffect, useRef } from "react";
import { IconBell } from "@tabler/icons-react";
import { getUnreadCount, fetchNotifications, markAsRead, markAllAsRead } from "@/lib/actions/notifications";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    getUnreadCount().then(setUnread);
    const interval = setInterval(() => getUnreadCount().then(setUnread), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const list = await fetchNotifications(10);
      setNotifications(list);
    }
  };

  const handleClick = async (n: Notification) => {
    if (!n.readAt) {
      await markAsRead(n.id);
      setUnread((prev) => Math.max(0, prev - 1));
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, readAt: new Date() } : x));
    }
    if (n.link) router.push(n.link);
    setOpen(false);
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-neutral-50 transition-colors"
        aria-label="Notifications"
      >
        <IconBell size={20} className="text-neutral-600" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-xl shadow-lg z-50 max-h-96 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-primary">Notifications</p>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-brand hover:text-brand-hover font-medium">
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-neutral-400">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-neutral-50 transition-colors",
                    !n.readAt && "bg-brand/5"
                  )}
                >
                  <p className={cn("text-sm", !n.readAt ? "font-semibold text-primary" : "font-medium text-neutral-600")}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{n.body}</p>
                  )}
                  <p className="text-[10px] text-neutral-400 mt-1">
                    {format(new Date(n.createdAt), "MMM d, HH:mm")}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
