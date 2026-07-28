"use client";

import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ConsultationStatusBadge } from "@/components/consultations/ConsultationStatusBadge";
import { IconMessageChatbot } from "@tabler/icons-react";

interface Consultation {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
}

export function PatientConsultationsList({ consultations }: { consultations: Consultation[] }) {
  return (
    <ActivityCard title="Recent Consultations" viewAllHref="/dashboard/patient/consultations">
      {consultations.length === 0 ? (
        <EmptyState
          icon={<IconMessageChatbot size={24} />}
          title="No consultations yet"
          description="Start a consultation with a clinician to get medical advice."
        />
      ) : (
        <div className="divide-y divide-border">
          {consultations.map((c) => (
            <a
              key={c.id}
              href={`/dashboard/patient/consultations/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-primary">{c.title}</p>
                <p className="text-xs text-neutral-500">{new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
              <ConsultationStatusBadge status={c.status as any} />
            </a>
          ))}
        </div>
      )}
    </ActivityCard>
  );
}
