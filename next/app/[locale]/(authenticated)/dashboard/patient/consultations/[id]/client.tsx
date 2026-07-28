"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { ConsultationStatusBadge } from "@/components/consultations/ConsultationStatusBadge";
import { PaymentStatusBadge } from "@/components/consultations/PaymentStatusBadge";
import { ConsultationTimeline } from "@/components/consultations/ConsultationTimeline";
import { WhatsAppButton } from "@/components/consultations/WhatsAppButton";
import { PrescriptionCard } from "@/components/consultations/PrescriptionCard";
import { getCommunicationLink } from "@/lib/actions/consultations";
import { format } from "date-fns";
import { IconStethoscope, IconCalendarDue, IconCurrencyDollar, IconFileDescription, IconPill } from "@tabler/icons-react";

interface Consultation {
  id: string;
  title: string;
  consultationType: string;
  symptoms: string | null;
  durationOfIllness: string | null;
  medicalHistory: string | null;
  status: string;
  fee: string;
  paidAt: Date | null;
  completedAt: Date | null;
  communicationLink: string | null;
  followUpDate: string | null;
  createdAt: Date;
  clinicianId: string | null;
}

interface StatusEvent {
  status: string;
  changedBy: string;
  createdAt: Date;
}

interface Note {
  id: string;
  diagnosis: string | null;
  treatment: string | null;
  prescription: string | null;
  advice: string | null;
  followUpDate: string | null;
  createdAt: Date;
}

interface File {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export function PatientConsultationDetailClient({
  consultation: c,
  statusHistory,
  notes,
  files,
  role,
}: {
  consultation: Consultation;
  statusHistory: StatusEvent[];
  notes: Note[];
  files: File[];
  role: "patient" | "clinician";
}) {
  const needsPayment = c.status === "draft" || c.status === "awaiting_payment";
  const canWhatsApp = ["paid", "waiting_for_clinician", "in_consultation"].includes(c.status);
  const latestNotes = notes[0];

  return (
    <AuthGuard allowedRoles={["patient", "clinician"]}>
      <DashboardHeader
        title={c.title}
        description={`Consultation ${c.id.slice(0, 8)}`}
      />

      <DashboardShell>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ActivityCard title="Details">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-500">Type</p>
                  <p className="text-sm font-medium text-primary capitalize mt-0.5">
                    {c.consultationType.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Status</p>
                  <div className="mt-0.5">
                    <ConsultationStatusBadge status={c.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Fee</p>
                  <p className="text-sm font-medium text-primary mt-0.5">${c.fee}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Submitted</p>
                  <p className="text-sm font-medium text-primary mt-0.5">
                    {format(new Date(c.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border space-y-3">
                {c.symptoms && (
                  <div>
                    <p className="text-xs text-neutral-500">Symptoms</p>
                    <p className="text-sm text-neutral-700 mt-0.5">{c.symptoms}</p>
                  </div>
                )}
                {c.durationOfIllness && (
                  <div>
                    <p className="text-xs text-neutral-500">Duration</p>
                    <p className="text-sm text-neutral-700 mt-0.5">{c.durationOfIllness}</p>
                  </div>
                )}
                {c.medicalHistory && (
                  <div>
                    <p className="text-xs text-neutral-500">Medical History</p>
                    <p className="text-sm text-neutral-700 mt-0.5">{c.medicalHistory}</p>
                  </div>
                )}
              </div>

              {c.followUpDate && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-neutral-500">Follow-up Date</p>
                  <p className="text-sm font-medium text-primary mt-0.5">
                    {format(new Date(c.followUpDate), "MMM d, yyyy")}
                  </p>
                </div>
              )}
            </ActivityCard>

            {files.length > 0 && (
              <ActivityCard title="Attachments">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {files.map((f) => (
                    <a
                      key={f.id}
                      href={f.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-xl border border-border hover:border-brand/20 transition-colors"
                    >
                      <IconFileDescription size={20} className="text-brand shrink-0" />
                      <span className="text-xs text-neutral-700 truncate">{f.fileName}</span>
                    </a>
                  ))}
                </div>
              </ActivityCard>
            )}

            {latestNotes && (
              <ActivityCard title="Clinical Notes">
                {latestNotes.diagnosis && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Diagnosis</p>
                    <p className="text-sm text-neutral-700">{latestNotes.diagnosis}</p>
                  </div>
                )}
                {latestNotes.treatment && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Treatment Plan</p>
                    <p className="text-sm text-neutral-700">{latestNotes.treatment}</p>
                  </div>
                )}
                {latestNotes.prescription && (
                  <PrescriptionCard prescription={latestNotes.prescription} />
                )}
                {latestNotes.advice && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Advice</p>
                    <p className="text-sm text-neutral-700">{latestNotes.advice}</p>
                  </div>
                )}
              </ActivityCard>
            )}
          </div>

          <div className="space-y-6">
            <ActivityCard title="Status Timeline">
              <ConsultationTimeline history={statusHistory} />
            </ActivityCard>

            {needsPayment && (
              <a
                href={`/dashboard/patient/consultations/${c.id}/payment`}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors"
              >
                <IconCurrencyDollar size={18} />
                Proceed to Payment
              </a>
            )}

            {canWhatsApp && (
              <WhatsAppButton
                onClick={() => getCommunicationLink(c.id)}
                disabled={!c.clinicianId}
              />
            )}

            {c.status === "completed" && (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                <p className="text-sm font-medium text-green-800">Consultation Completed</p>
                {c.completedAt && (
                  <p className="text-xs text-green-600 mt-1">
                    {format(new Date(c.completedAt), "MMM d, yyyy 'at' HH:mm")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
