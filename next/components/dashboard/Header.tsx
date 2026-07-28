"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import {
  IconLogout,
  IconUser,
  IconChevronDown,
  IconBell,
} from "@tabler/icons-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface DashboardHeaderProps {
  title: string;
  description?: string;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-primary font-primary">{title}</h1>
        {description && (
          <p className="text-neutral-500 mt-1 text-sm font-secondary">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-neutral-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand font-semibold text-sm font-primary">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-primary font-primary leading-tight">{user?.name}</p>
            <p className="text-xs text-neutral-500 capitalize font-secondary">{user?.role}</p>
          </div>
          <IconChevronDown size={16} className={cn(
            "text-neutral-400 transition-transform hidden sm:block",
            menuOpen && "rotate-180"
          )} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-border rounded-xl shadow-lg py-1 z-50">
            <div className="px-4 py-2 border-b border-border sm:hidden">
              <p className="text-sm font-medium text-primary">{user?.name}</p>
              <p className="text-xs text-neutral-500 capitalize">{user?.role}</p>
            </div>
            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors">
              <IconUser size={16} />
              Profile
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <IconLogout size={16} />
              Sign out
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
