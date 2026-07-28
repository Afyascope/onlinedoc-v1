import { IconPill } from "@tabler/icons-react";

interface PrescriptionCardProps {
  prescription: string;
}

export function PrescriptionCard({ prescription }: PrescriptionCardProps) {
  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <IconPill size={18} className="text-brand" />
        <h3 className="text-sm font-semibold text-primary">Prescription</h3>
      </div>
      <p className="text-sm text-neutral-700 whitespace-pre-wrap font-secondary">{prescription}</p>
    </div>
  );
}
