import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  // User roles
  patient: "bg-blue-50 text-blue-700",
  clinician: "bg-green-50 text-green-700",
  admin: "bg-purple-50 text-purple-700",
  // Verification
  verified: "bg-green-50 text-green-700",
  unverified: "bg-amber-50 text-amber-700",
  // Approval
  approved: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  rejected: "bg-red-50 text-red-700",
  // Active/Suspended
  active: "bg-green-50 text-green-700",
  suspended: "bg-red-50 text-red-700",
  // Consultation statuses
  draft: "bg-neutral-100 text-neutral-600",
  awaiting_payment: "bg-amber-50 text-amber-700",
  paid: "bg-blue-50 text-blue-700",
  waiting_for_clinician: "bg-purple-50 text-purple-700",
  in_consultation: "bg-cyan-50 text-cyan-700",
  completed: "bg-green-50 text-green-700",
  follow_up_required: "bg-orange-50 text-orange-700",
  closed: "bg-neutral-100 text-neutral-500",
  cancelled: "bg-red-50 text-red-700",
  // Payment statuses
  success: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-orange-50 text-orange-700",
  // Boolean
  true: "bg-green-50 text-green-700",
  false: "bg-amber-50 text-amber-700",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const lower = status?.toLowerCase() ?? "";
  const color = statusColors[lower] || "bg-neutral-100 text-neutral-600";
  const label = status?.replace(/_/g, " ") ?? "Unknown";

  return (
    <span className={cn(
      "px-2.5 py-1 rounded-lg text-xs font-medium capitalize inline-block",
      color, className,
    )}>
      {label}
    </span>
  );
}
