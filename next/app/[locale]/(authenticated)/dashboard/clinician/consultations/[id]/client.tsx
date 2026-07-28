"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { ConsultationStatusBadge } from "@/components/consultations/ConsultationStatusBadge";
import { PaymentStatusBadge } from "@/components/consultations/PaymentStatusBadge";
import { ConsultationTimeline } from "@/components/consultations/ConsultationTimeline";
import { ConsultationNotes } from "@/components/consultations/ConsultationNotes";
import { WhatsAppButton } from "@/components/consultations/WhatsAppButton";
import { PrescriptionCard } from "@/components/consultations/PrescriptionCard";
import { updateConsultationStatus, getCommunicationLink, completeConsultation } from "@/lib/actions/consultations";
import { format } from "date-fns";
import { IconUser, IconMail, IconPhone, IconFileDescription, IconStethoscope, IconCheck } from "@tabler/icons-react";

interface Consultation {
  id: string;
  patientId: string;
  title: string;
  consultationType: string;
  symptoms: string | null;
  durationOfIllness: string | null;
  medicalHistory: string | null;
  status: string;
  fee: string;
  paidAt: Date | null;
  completedAt: Date | null;
  followUpDate: string | null;
  createdAt: Date;
}

interface StatusEvent { status: string; changedBy: string; createdAt: Date }
interface Note { id?: string; diagnosis?: string | null; treatment?: string | null; prescription?: string | null; advice?: string | null; followUpDate?: string | null }
interface File { id: string; fileName: string; fileUrl: string; fileType: string }
interface Patient { id: string; name: string; email: string }

export function ClinicianConsultationDetailClient({
  consultation: c, statusHistory, notes, files, patient, userId, canAssign,
}: {
  consultation: Consultation; statusHistory: StatusEvent[]; notes: Note[]; files: File[]; patient: Patient | null; userId: string; canAssign: boolean;
}) {
  const router = useRouter();
  const [showComplete, setShowComplete] = useState(false);
  const [completeForm, setCompleteForm] = useState({ diagnosis: "", treatment: "", prescription: "", advice: "", followUpDate: "" });
  const [completing, setCompleting] = useState(false);

  const latestNotes = notes[0];
  const canStart = c.status === "waiting_for_clinician" || c.status === "paid";

  const handleStart = async () => {
    await updateConsultationStatus(c.id, "in_consultation");
    router.refresh();
  };

  const handleComplete = async () => {
    setCompleting(true);
    await completeConsultation(c.id, completeForm);
    setCompleting(false);
    setShowComplete(false);
    router.refresh();
  };

  return (
    <AuthGuard allowedRoles={["clinician"]}>
      <DashboardHeader
        title={c.title}
        description={`Patient: ${patient?.name || "Unknown"}`}
      />

      <DashboardShell>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ActivityCard title="Patient Information">
              {patient ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-lg">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">{patient.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{patient.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">Patient info unavailable</p>
              )}
            </ActivityCard>

            <ActivityCard title="Consultation Details">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-500">Type</p>
                  <p className="text-sm font-medium text-primary mt-0.5 capitalize">{c.consultationType.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Submitted</p>
                  <p className="text-sm font-medium text-primary mt-0.5">{format(new Date(c.createdAt), "MMM d, yyyy HH:mm")}</p>
                </div>
              </div>
              {c.symptoms && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Symptoms</p>
                  <p className="text-sm text-neutral-700 mt-1">{c.symptoms}</p>
                </div>
              )}
              {c.durationOfIllness && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Duration</p>
                  <p className="text-sm text-neutral-700 mt-1">{c.durationOfIllness}</p>
                </div>
              )}
              {c.medicalHistory && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Medical History</p>
                  <p className="text-sm text-neutral-700 mt-1">{c.medicalHistory}</p>
                </div>
              )}
            </ActivityCard>

            {files.length > 0 && (
              <ActivityCard title="Attachments">
                <div className="space-y-2">
                  {files.map((f) => (
                    <a key={f.id} href={f.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-xl border border-border hover:border-brand/20 transition-colors">
                      <IconFileDescription size={18} className="text-brand" />
                      <span className="text-xs text-neutral-700">{f.fileName}</span>
                    </a>
                  ))}
                </div>
              </ActivityCard>
            )}

            <ActivityCard title={showComplete ? "Complete Consultation" : "Clinical Notes"}>
              {showComplete ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Diagnosis</label>
                    <textarea value={completeForm.diagnosis} onChange={(e) => setCompleteForm({ ...completeForm, diagnosis: e.target.value })} rows={2}
                      className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Treatment</label>
                    <textarea value={completeForm.treatment} onChange={(e) => setCompleteForm({ ...completeForm, treatment: e.target.value })} rows={2}
                      className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Prescription</label>
                    <textarea value={completeForm.prescription} onChange={(e) => setCompleteForm({ ...completeForm, prescription: e.target.value })} rows={2}
                      placeholder="Medication, dosage, frequency..."
                      className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Advice</label>
                    <textarea value={completeForm.advice} onChange={(e) => setCompleteForm({ ...completeForm, advice: e.target.value })} rows={2}
                      className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Follow-up Date</label>
                    <input type="date" value={completeForm.followUpDate} onChange={(e) => setCompleteForm({ ...completeForm, followUpDate: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleComplete} disabled={completing}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1">
                      <IconCheck size={16} /> {completing ? "Completing..." : "Complete & Save"}
                    </button>
                    <button onClick={() => setShowComplete(false)}
                      className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 rounded-xl transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {latestNotes ? (
                    <div className="space-y-4">
                      {latestNotes.diagnosis && <div><p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Diagnosis</p><p className="text-sm text-neutral-700">{latestNotes.diagnosis}</p></div>}
                      {latestNotes.treatment && <div className="pt-3 border-t border-border"><p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Treatment</p><p className="text-sm text-neutral-700">{latestNotes.treatment}</p></div>}
                      {latestNotes.prescription && <div className="pt-3"><PrescriptionCard prescription={latestNotes.prescription} /></div>}
                      {latestNotes.advice && <div className="pt-3 border-t border-border"><p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Advice</p><p className="text-sm text-neutral-700">{latestNotes.advice}</p></div>}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">No notes recorded yet.</p>
                  )}
                  {c.status === "in_consultation" && (
                    <button onClick={() => setShowComplete(true)}
                      className="mt-4 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors">
                      Complete Consultation
                    </button>
                  )}
                </>
              )}
            </ActivityCard>
          </div>

          <div className="space-y-6">
            <ActivityCard title="Status">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-neutral-500">Current</span>
                  <ConsultationStatusBadge status={c.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-neutral-500">Payment</span>
                  <PaymentStatusBadge status={c.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-neutral-500">Fee</span>
                  <span className="text-sm font-medium text-primary">${c.fee}</span>
                </div>
              </div>
            </ActivityCard>

            <ActivityCard title="Actions">
              <div className="space-y-3">
                {canStart && (
                  <button onClick={handleStart}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors">
                    <IconStethoscope size={18} /> Start Consultation
                  </button>
                )}
                {(c.status === "in_consultation" || c.status === "waiting_for_clinician") && (
                  <WhatsAppButton
                    onClick={() => getCommunicationLink(c.id)}
                    label="Contact Patient on WhatsApp"
                  />
                )}
                {c.status === "in_consultation" && !showComplete && (
                  <button onClick={() => setShowComplete(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors">
                    <IconCheck size={18} /> Complete Consultation
                  </button>
                )}
              </div>
            </ActivityCard>

            <ActivityCard title="Status Timeline">
              <ConsultationTimeline history={statusHistory} />
            </ActivityCard>
          </div>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
