"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { ConsultationStatusBadge } from "@/components/consultations/ConsultationStatusBadge";
import { PaymentStatusBadge } from "@/components/consultations/PaymentStatusBadge";
import { ConsultationTimeline } from "@/components/consultations/ConsultationTimeline";
import { WhatsAppButton } from "@/components/consultations/WhatsAppButton";
import { CatalogueSearch, type CatalogueOption } from "@/components/consultations/CatalogueSearch";
import { updateConsultationStatus, getCommunicationLink, completeConsultation } from "@/lib/actions/consultations";
import { PRESCRIPTION_FREQUENCY_OPTIONS, isSupportedPrescriptionFrequency } from "@/lib/prescriptions/frequency";
import { formatPrescription } from "@/lib/prescriptions/display";
import { format } from "date-fns";
import {
  IconUser, IconFileDescription, IconStethoscope, IconCheck, IconTrash,
  IconFlask, IconScan, IconPill, IconPlus, IconDownload, IconAlertTriangle,
} from "@tabler/icons-react";
import type { CatalogueDomain } from "@/lib/catalogue/domains";

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
interface Note {
  id?: string;
  historyNotes?: string | null;
  diagnosis?: string | null;
  prescription?: string | null;
  advice?: string | null;
  followUpDate?: string | null;
}
interface File { id: string; fileName: string; fileUrl: string; fileType: string }
interface Patient { id: string; name: string; email: string }

interface DiagnosisRow {
  id: string;
  resourceId: string;
  nameSnapshot: string;
  codeSnapshot: string | null;
  codingSystemSnapshot: string | null;
  notes: string | null;
}

interface RequestRow {
  id: string;
  domain: string;
  resourceId: string;
  nameSnapshot: string;
  codeSnapshot: string | null;
  categorySnapshot: string | null;
  modalitySnapshot: string | null;
  notes: string | null;
}

interface PrescriptionRow {
  id: string;
  medication: string;
  dosage: string;
  dosageForm: string | null;
  frequency: string;
  duration: string | null;
  route: string | null;
  instructions: string | null;
  strengthSnapshot?: string | null;
}

interface SelectedDiagnosis { resourceId: string; name: string; code: string | null; notes: string }
interface SelectedRequest { resourceId: string; name: string; code: string | null; notes: string }

interface SelectedPrescription {
  resourceId: string;
  name: string;
  dosage: string;
  dosageForm: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

export function ClinicianConsultationDetailClient({
  consultation: c, statusHistory, notes, files, patient, userId, canAssign,
  diagnoses = [], requests = [], prescriptionItems = [],
}: {
  consultation: Consultation;
  statusHistory: StatusEvent[];
  notes: Note[];
  files: File[];
  patient: Patient | null;
  userId: string;
  canAssign: boolean;
  diagnoses?: DiagnosisRow[];
  requests?: RequestRow[];
  prescriptionItems?: PrescriptionRow[];
}) {
  const router = useRouter();
  const [showComplete, setShowComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [historyNotes, setHistoryNotes] = useState("");
  const [advice, setAdvice] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<SelectedDiagnosis[]>([]);
  const [laboratory, setLaboratory] = useState<SelectedRequest[]>([]);
  const [radiology, setRadiology] = useState<SelectedRequest[]>([]);
  const [prescriptions, setPrescriptions] = useState<SelectedPrescription[]>([]);
  const [medicationDraft, setMedicationDraft] = useState<SelectedPrescription | null>(null);

  const latestNotes = notes[0];
  const canStart = c.status === "waiting_for_clinician" || c.status === "paid";
  const laboratoryRows = useMemo(() => requests.filter((item) => item.domain === "laboratory"), [requests]);
  const radiologyRows = useMemo(() => requests.filter((item) => item.domain === "radiology"), [requests]);
  const hasDocuments = c.status === "completed" || prescriptionItems.length > 0 || requests.length > 0;

  const handleStart = async () => {
    await updateConsultationStatus(c.id, "in_consultation");
    router.refresh();
  };

  const handleComplete = async () => {
    setCompleting(true);
    setError(null);
    try {
      await completeConsultation(c.id, {
        historyNotes,
        advice,
        followUpDate: followUpDate || undefined,
        diagnoses: selectedDiagnoses.map((item) => ({ resourceId: item.resourceId, notes: item.notes || undefined })),
        laboratoryRequests: laboratory.map((item) => ({ resourceId: item.resourceId, notes: item.notes || undefined })),
        radiologyRequests: radiology.map((item) => ({ resourceId: item.resourceId, notes: item.notes || undefined })),
        prescriptions: prescriptions.map((item) => ({
          resourceId: item.resourceId,
          dosage: item.dosage,
          dosageForm: item.dosageForm || undefined,
          frequency: item.frequency,
          duration: item.duration || undefined,
          route: item.route || undefined,
          instructions: item.instructions || undefined,
        })),
      });
      setShowComplete(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete the consultation.");
    } finally {
      setCompleting(false);
    }
  };

  const addDiagnosis = (option: CatalogueOption) => {
    setSelectedDiagnoses((current) => current.some((item) => item.resourceId === option.id)
      ? current
      : [...current, { resourceId: option.id, name: option.name, code: option.code, notes: "" }]);
  };

  const addRequest = (domain: CatalogueDomain, option: CatalogueOption) => {
    const setter = domain === "laboratory" ? setLaboratory : setRadiology;
    setter((current) => current.some((item) => item.resourceId === option.id)
      ? current
      : [...current, { resourceId: option.id, name: option.name, code: option.code, notes: "" }]);
  };

  const chooseMedication = (option: CatalogueOption) => {
    setMedicationDraft({
      resourceId: option.id,
      name: option.name,
      dosage: "",
      dosageForm: option.dosageForm ?? "",
      frequency: "",
      duration: "",
      route: option.route ?? "",
      instructions: "",
    });
  };

  const addPrescription = () => {
    if (!medicationDraft) return;
    if (!medicationDraft.dosage.trim() || !medicationDraft.frequency.trim()) {
      setError("Enter a dosage and frequency before adding the prescription item.");
      return;
    }
    if (!isSupportedPrescriptionFrequency(medicationDraft.frequency)) {
      setError("Select one of the supported prescription frequencies.");
      return;
    }
    setPrescriptions((current) => [...current, medicationDraft]);
    setMedicationDraft(null);
    setError(null);
  };

  return (
    <AuthGuard allowedRoles={["clinician"]}>
      <DashboardHeader title={c.title} description={`Patient: ${patient?.name || "Unknown"}`} />

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
                <div className="space-y-6">
                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                      <IconAlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">History Notes</label>
                    <p className="text-[11px] text-neutral-400 mt-0.5">These notes become the Clinical Summary on request and clinical documents.</p>
                    <textarea value={historyNotes} onChange={(event) => setHistoryNotes(event.target.value)} rows={4}
                      className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Diagnosis</label>
                    <div className="mt-1">
                      <CatalogueSearch domain="diagnosis" placeholder="Search diagnoses by name or code..." onSelect={addDiagnosis} />
                    </div>
                    {selectedDiagnoses.length > 0 && (
                      <ul className="mt-2 space-y-2">
                        {selectedDiagnoses.map((item, index) => (
                          <li key={item.resourceId} className="p-3 rounded-xl border border-border">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-primary">{item.name}</p>
                                {item.code && <p className="text-xs text-neutral-500">Code {item.code}</p>}
                              </div>
                              <button type="button" onClick={() => setSelectedDiagnoses((current) => current.filter((_, i) => i !== index))} className="text-neutral-400 hover:text-red-600">
                                <IconTrash size={15} />
                              </button>
                            </div>
                            <input value={item.notes} onChange={(event) => setSelectedDiagnoses((current) => current.map((row, i) => i === index ? { ...row, notes: event.target.value } : row))}
                              placeholder="Diagnosis notes (optional)"
                              className="mt-2 w-full px-2.5 py-1.5 text-xs border border-border rounded-lg bg-white" />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Requests</label>
                    <div className="mt-1 space-y-3">
                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 mb-1"><IconFlask size={14} className="text-brand" /> Laboratory</p>
                        <CatalogueSearch domain="laboratory" placeholder="Search laboratory tests..." onSelect={(option) => addRequest("laboratory", option)} />
                        <SelectedRequests items={laboratory} setItems={setLaboratory} />
                      </div>
                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 mb-1"><IconScan size={14} className="text-brand" /> Radiology / Imaging</p>
                        <CatalogueSearch domain="radiology" placeholder="Search radiology services..." onSelect={(option) => addRequest("radiology", option)} />
                        <SelectedRequests items={radiology} setItems={setRadiology} />
                      </div>
                      <p className="text-[11px] text-neutral-400">Homecare requests preserve the existing intended architecture; no approved homecare catalogue is configured.</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Prescription</label>
                    <div className="mt-1">
                      <CatalogueSearch domain="medication" placeholder="Search medications by name or ingredient..." onSelect={chooseMedication} />
                    </div>

                    {medicationDraft && (
                      <div className="mt-3 p-3 rounded-xl border border-brand/30 bg-brand/5 space-y-2">
                        <p className="text-sm font-medium text-primary">{medicationDraft.name}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Dosage" value={medicationDraft.dosage} onChange={(value) => setMedicationDraft({ ...medicationDraft, dosage: value })} placeholder="e.g. 500 mg" />
                          <Field label="Dosage form" value={medicationDraft.dosageForm} onChange={(value) => setMedicationDraft({ ...medicationDraft, dosageForm: value })} placeholder="e.g. tablet" />
                          <SelectField
                            label="Frequency"
                            value={medicationDraft.frequency}
                            onChange={(value) => setMedicationDraft({ ...medicationDraft, frequency: value })}
                            options={PRESCRIPTION_FREQUENCY_OPTIONS}
                            placeholder="Select frequency"
                          />
                          <Field label="Duration" value={medicationDraft.duration} onChange={(value) => setMedicationDraft({ ...medicationDraft, duration: value })} placeholder="e.g. 5 days" />
                          <Field label="Route" value={medicationDraft.route} onChange={(value) => setMedicationDraft({ ...medicationDraft, route: value })} placeholder="e.g. oral" />
                          <Field label="Additional instructions" value={medicationDraft.instructions} onChange={(value) => setMedicationDraft({ ...medicationDraft, instructions: value })} placeholder="Optional" />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={addPrescription} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-brand hover:bg-brand-hover rounded-lg">
                            <IconPlus size={14} /> Add prescription item
                          </button>
                          <button type="button" onClick={() => setMedicationDraft(null)} className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {prescriptions.length > 0 && (
                      <ul className="mt-2 space-y-2">
                        {prescriptions.map((item, index) => (
                          <li key={`${item.resourceId}-${index}`} className="p-3 rounded-xl border border-border">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-primary">{item.name}</p>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                  {formatPrescription({
                                    medication: item.name,
                                    dosage: item.dosage,
                                    dosageForm: item.dosageForm,
                                    frequency: item.frequency,
                                    duration: item.duration,
                                    route: item.route,
                                    instructions: item.instructions,
                                  }).instruction ?? "Dosage instructions not recorded."}
                                </p>
                              </div>
                              <button type="button" onClick={() => setPrescriptions((current) => current.filter((_, i) => i !== index))} className="text-neutral-400 hover:text-red-600">
                                <IconTrash size={15} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Advice</label>
                    <textarea value={advice} onChange={(event) => setAdvice(event.target.value)} rows={2}
                      className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Follow-up Date</label>
                    <input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleComplete} disabled={completing}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1">
                      <IconCheck size={16} /> {completing ? "Completing..." : "Complete & Save"}
                    </button>
                    <button onClick={() => { setShowComplete(false); setError(null); }}
                      className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 rounded-xl transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {latestNotes || diagnoses.length > 0 || requests.length > 0 || prescriptionItems.length > 0 ? (
                    <div className="space-y-4">
                      {latestNotes?.historyNotes && <Section title="History Notes"><p className="text-sm text-neutral-700 whitespace-pre-wrap">{latestNotes.historyNotes}</p></Section>}
                      {diagnoses.length > 0 && (
                        <Section title="Diagnoses">
                          <ul className="space-y-1">
                            {diagnoses.map((item) => (
                              <li key={item.id} className="text-sm text-neutral-700">
                                {item.nameSnapshot}
                                {item.codeSnapshot ? <span className="text-xs text-neutral-400"> · {item.codeSnapshot}</span> : null}
                                {item.notes ? <span className="block text-xs text-neutral-500">{item.notes}</span> : null}
                              </li>
                            ))}
                          </ul>
                        </Section>
                      )}
                      {laboratoryRows.length > 0 && (
                        <Section title="Laboratory Requests">
                          <ul className="space-y-1">{laboratoryRows.map((item) => <li key={item.id} className="text-sm text-neutral-700">{item.nameSnapshot}{item.codeSnapshot ? <span className="text-xs text-neutral-400"> · {item.codeSnapshot}</span> : null}</li>)}</ul>
                        </Section>
                      )}
                      {radiologyRows.length > 0 && (
                        <Section title="Radiology Requests">
                          <ul className="space-y-1">{radiologyRows.map((item) => <li key={item.id} className="text-sm text-neutral-700">{item.nameSnapshot}{item.codeSnapshot ? <span className="text-xs text-neutral-400"> · {item.codeSnapshot}</span> : null}</li>)}</ul>
                        </Section>
                      )}
                      {prescriptionItems.length > 0 && (
                        <Section title="Prescriptions">
                          <ul className="space-y-2">
                            {prescriptionItems.map((item) => {
                              const display = formatPrescription({
                                medication: item.medication,
                                dosage: item.dosage,
                                dosageForm: item.dosageForm,
                                frequency: item.frequency,
                                duration: item.duration,
                                route: item.route,
                                instructions: item.instructions,
                                strength: item.strengthSnapshot,
                              });
                              return (
                                <li key={item.id} className="text-sm text-neutral-700">
                                  <span className="font-medium text-primary">{display.heading}</span>
                                  <span className="block text-xs text-neutral-500">{display.instruction ?? "Dosage instructions not recorded."}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </Section>
                      )}
                      {latestNotes?.advice && <Section title="Advice"><p className="text-sm text-neutral-700 whitespace-pre-wrap">{latestNotes.advice}</p></Section>}
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
                  <span className="text-sm font-medium text-primary">KES {c.fee}</span>
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
                  <WhatsAppButton onClick={() => getCommunicationLink(c.id)} label="Contact Patient on WhatsApp" />
                )}
                {c.status === "in_consultation" && !showComplete && (
                  <button onClick={() => setShowComplete(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors">
                    <IconCheck size={18} /> Complete Consultation
                  </button>
                )}
              </div>
            </ActivityCard>

            {hasDocuments && (
              <ActivityCard title="Documents">
                <div className="space-y-2">
                  <DocumentLink id={c.id} type="report" label="Complete clinical report" icon={<IconFileDescription size={16} />} />
                  <DocumentLink id={c.id} type="facesheet" label="Medical facesheet" icon={<IconUser size={16} />} />
                  {prescriptionItems.length > 0 && <DocumentLink id={c.id} type="prescription" label="Prescription PDF" icon={<IconPill size={16} />} />}
                  {laboratoryRows.length > 0 && <DocumentLink id={c.id} type="laboratory" label="Laboratory request PDF" icon={<IconFlask size={16} />} />}
                  {radiologyRows.length > 0 && <DocumentLink id={c.id} type="radiology" label="Radiology request PDF" icon={<IconScan size={16} />} />}
                </div>
              </ActivityCard>
            )}

            <ActivityCard title="Status Timeline">
              <ConsultationTimeline history={statusHistory} />
            </ActivityCard>
          </div>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}
        className="mt-0.5 w-full px-2.5 py-1.5 text-xs border border-border rounded-lg bg-white" />
    </label>
  );
}

function SelectField({ label, value, onChange, options, placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}
        className="mt-0.5 w-full px-2.5 py-1.5 text-xs border border-border rounded-lg bg-white">
        <option value="">{placeholder ?? "Select"}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function SelectedRequests({ items, setItems }: { items: SelectedRequest[]; setItems: (updater: (current: SelectedRequest[]) => SelectedRequest[]) => void }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-2 space-y-2">
      {items.map((item, index) => (
        <li key={item.resourceId} className="p-2.5 rounded-xl border border-border">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-primary">{item.name}</p>
              {item.code && <p className="text-xs text-neutral-500">Code {item.code}</p>}
            </div>
            <button type="button" onClick={() => setItems((current) => current.filter((_, i) => i !== index))} className="text-neutral-400 hover:text-red-600">
              <IconTrash size={15} />
            </button>
          </div>
          <input value={item.notes} onChange={(event) => setItems((current) => current.map((row, i) => i === index ? { ...row, notes: event.target.value } : row))}
            placeholder="Request notes (optional)"
            className="mt-2 w-full px-2.5 py-1.5 text-xs border border-border rounded-lg bg-white" />
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-3 border-t border-border first:pt-0 first:border-0">
      <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">{title}</p>
      {children}
    </div>
  );
}

function DocumentLink({ id, type, label, icon }: { id: string; type: string; label: string; icon: React.ReactNode }) {
  return (
    <a href={`/api/documents/consultation/${id}/${type}`} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 p-2.5 rounded-xl border border-border hover:border-brand/30 hover:bg-brand/5 transition-colors">
      <span className="text-brand">{icon}</span>
      <span className="flex-1 text-xs font-medium text-neutral-700">{label}</span>
      <IconDownload size={14} className="text-neutral-400" />
    </a>
  );
}
