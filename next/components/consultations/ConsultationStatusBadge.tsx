import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:               { label: "Draft",               color: "bg-neutral-100 text-neutral-600" },
  awaiting_payment:    { label: "Awaiting Payment",    color: "bg-amber-50 text-amber-700" },
  paid:                { label: "Paid",                color: "bg-green-50 text-green-700" },
  waiting_for_clinician: { label: "Waiting for Clinician", color: "bg-blue-50 text-blue-700" },
  in_consultation:     { label: "In Consultation",     color: "bg-purple-50 text-purple-700" },
  completed:           { label: "Completed",           color: "bg-green-50 text-green-700" },
  follow_up_required:  { label: "Follow-up Required",  color: "bg-orange-50 text-orange-700" },
  closed:              { label: "Closed",              color: "bg-neutral-100 text-neutral-500" },
};

export function ConsultationStatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS_CONFIG[status] || { label: status, color: "bg-neutral-100 text-neutral-600" };
  return (
    <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium", config.color, className)}>
      {config.label}
    </span>
  );
}
