"use client";

import { useState } from "react";
import { createConsultation } from "@/lib/actions/consultations";
import { FileUploader } from "@/components/upload/FileUploader";

const CONSULTATION_TYPES = [
  { value: "general", label: "General Consultation" },
  { value: "follow_up", label: "Follow-up Consultation" },
  { value: "urgent", label: "Urgent Consultation" },
];

export function ConsultationForm({ onSuccess }: { onSuccess: (consultationId: string) => void }) {
  const [form, setForm] = useState({
    consultationType: "general",
    title: "",
    symptoms: "",
    durationOfIllness: "",
    medicalHistory: "",
  });
  const [files, setFiles] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Please describe your chief complaint"); return; }
    setSubmitting(true);
    setError("");

    const result = await createConsultation(form);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else if (result.consultationId) {
      onSuccess(result.consultationId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Consultation Type</label>
        <div className="mt-1.5 grid grid-cols-3 gap-3">
          {CONSULTATION_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setForm({ ...form, consultationType: t.value })}
              className={`px-4 py-3 text-sm font-medium rounded-xl border-2 transition-all ${
                form.consultationType === t.value
                  ? "border-brand bg-brand/5 text-brand"
                  : "border-border text-neutral-600 hover:border-neutral-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Chief Complaint *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Persistent headache for five days"
          required
          className="mt-1.5 w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Symptoms</label>
        <textarea
          value={form.symptoms}
          onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
          rows={3}
          placeholder="Describe your symptoms in detail..."
          className="mt-1.5 w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Duration of Illness</label>
          <input
            type="text"
            value={form.durationOfIllness}
            onChange={(e) => setForm({ ...form, durationOfIllness: e.target.value })}
            placeholder="e.g. 3 days, 2 weeks"
            className="mt-1.5 w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Medical History</label>
        <textarea
          value={form.medicalHistory}
          onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
          rows={2}
          placeholder="Relevant medical history, allergies, current medications..."
          className="mt-1.5 w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Supporting Documents (optional)</label>
        <div className="mt-1.5">
          <FileUploader onFilesChange={setFiles} />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-6 py-3 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Consultation Request"}
      </button>
    </form>
  );
}
