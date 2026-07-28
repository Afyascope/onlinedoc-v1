"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { usePathname } from "next/navigation";
import { Link } from "next-view-transitions";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";
import {
  IconDashboard,
  IconCalendarDue,
  IconFiles,
  IconPill,
  IconCreditCard,
  IconUser,
  IconUsers,
  IconStethoscope,
  IconClipboardList,
  IconSettings,
  IconPencil,
  IconArrowLeft,
  IconMenu2,
  IconX,
  IconBell,
  IconMessageChatbot,
} from "@tabler/icons-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navConfig: Record<UserRole, NavItem[]> = {
  patient: [
    { label: "Overview", href: "/dashboard/patient", icon: <IconDashboard size={20} /> },
    { label: "Consultations", href: "/dashboard/patient/consultations", icon: <IconMessageChatbot size={20} /> },
    { label: "Appointments", href: "/dashboard/patient/appointments", icon: <IconCalendarDue size={20} /> },
    { label: "Medical Records", href: "/dashboard/patient/records", icon: <IconFiles size={20} /> },
    { label: "Prescriptions", href: "/dashboard/patient/prescriptions", icon: <IconPill size={20} /> },
    { label: "Payments", href: "/dashboard/patient/payments", icon: <IconCreditCard size={20} /> },
    { label: "Notifications", href: "/dashboard/notifications", icon: <IconBell size={20} /> },
    { label: "Profile", href: "/dashboard/patient/profile", icon: <IconUser size={20} /> },
  ],
  clinician: [
    { label: "Overview", href: "/dashboard/clinician", icon: <IconDashboard size={20} /> },
    { label: "Patients", href: "/dashboard/clinician/patients", icon: <IconUsers size={20} /> },
    { label: "Schedule", href: "/dashboard/clinician/schedule", icon: <IconCalendarDue size={20} /> },
    { label: "Consultations", href: "/dashboard/clinician/consultations", icon: <IconStethoscope size={20} /> },
    { label: "Notifications", href: "/dashboard/notifications", icon: <IconBell size={20} /> },
    { label: "Profile", href: "/dashboard/clinician/profile", icon: <IconUser size={20} /> },
  ],
  admin: [
    { label: "Overview", href: "/dashboard/admin", icon: <IconDashboard size={20} /> },
    { label: "Users", href: "/dashboard/admin/users", icon: <IconUsers size={20} /> },
    { label: "Clinicians", href: "/dashboard/admin/clinicians", icon: <IconStethoscope size={20} /> },
    { label: "Content", href: "/dashboard/admin/content", icon: <IconPencil size={20} /> },
    { label: "Consultations", href: "/dashboard/clinician/consultations", icon: <IconStethoscope size={20} /> },
    { label: "Notifications", href: "/dashboard/notifications", icon: <IconBell size={20} /> },
    { label: "Settings", href: "/dashboard/admin/settings", icon: <IconSettings size={20} /> },
  ],
};

export function DashboardSidebar() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const { role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const items = role ? navConfig[role] : [];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white border border-border shadow-sm hover:bg-neutral-50 transition-colors"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <IconX size={20} className="text-primary" /> : <IconMenu2 size={20} className="text-primary" />}
      </button>

      <aside className={cn(
        "fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-border flex flex-col transition-transform duration-200 z-40",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-border">
          <Link href={`/${locale}`} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-sm font-primary">
              OD
            </div>
            <span className="text-lg font-bold text-primary font-primary tracking-tight">OnlineDoc</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-brand/10 text-brand"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
                )}
              >
                <span className={cn(
                  "shrink-0",
                  isActive ? "text-brand" : "text-neutral-400"
                )}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-500 hover:text-primary rounded-xl hover:bg-neutral-50 transition-all duration-200"
          >
            <IconArrowLeft size={18} />
            Back to site
          </Link>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
