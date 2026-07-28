import { cn } from "@/lib/utils";

export function PaymentStatusBadge({ status, className }: { status: string; className?: string }) {
  const isPaid = ["paid", "waiting_for_clinician", "in_consultation", "completed", "follow_up_required", "closed"].includes(status);
  const isPending = ["draft", "awaiting_payment"].includes(status);

  return (
    <span className={cn(
      "px-2.5 py-1 rounded-lg text-xs font-medium",
      isPaid ? "bg-green-50 text-green-700" : isPending ? "bg-amber-50 text-amber-700" : "bg-neutral-100 text-neutral-500",
      className
    )}>
      {isPaid ? "Paid" : isPending ? "Pending" : "N/A"}
    </span>
  );
}
