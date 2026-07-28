import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface StatusEvent {
  status: string;
  changedBy: string;
  createdAt: Date;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft Created",
  awaiting_payment: "Awaiting Payment",
  paid: "Payment Received",
  waiting_for_clinician: "Assigned to Clinician",
  in_consultation: "Consultation Started",
  completed: "Consultation Completed",
  follow_up_required: "Follow-up Required",
  closed: "Closed",
};

export function ConsultationTimeline({ history }: { history: StatusEvent[] }) {
  const sorted = [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="space-y-0">
      {sorted.map((event, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-3 h-3 rounded-full border-2 shrink-0",
              i === sorted.length - 1 ? "bg-brand border-brand" : "bg-white border-neutral-300"
            )} />
            {i < sorted.length - 1 && <div className="w-px flex-1 bg-neutral-200 my-1" />}
          </div>
          <div className="pb-6 last:pb-0">
            <p className="text-sm font-medium text-primary">
              {STATUS_LABELS[event.status] || event.status}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {format(new Date(event.createdAt), "MMM d, yyyy HH:mm")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
