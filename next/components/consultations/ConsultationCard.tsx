import { ConsultationStatusBadge } from "./ConsultationStatusBadge";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { format } from "date-fns";
import { IconCalendarDue, IconUser } from "@tabler/icons-react";

interface ConsultationCardProps {
  consultation: {
    id: string;
    title: string;
    consultationType: string;
    status: string;
    fee: string;
    createdAt: Date;
  };
  href: string;
}

export function ConsultationCard({ consultation, href }: ConsultationCardProps) {
  return (
    <a
      href={href}
      className="block p-4 rounded-xl border border-border bg-white hover:border-brand/20 hover:shadow-sm transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary truncate">{consultation.title}</p>
          <p className="text-xs text-neutral-500 mt-0.5 capitalize">
            {consultation.consultationType.replace("_", " ")}
          </p>
        </div>
        <ConsultationStatusBadge status={consultation.status} />
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
        <span className="flex items-center gap-1">
          <IconCalendarDue size={14} />
          {format(new Date(consultation.createdAt), "MMM d, yyyy")}
        </span>
        <PaymentStatusBadge status={consultation.status} />
      </div>
    </a>
  );
}
