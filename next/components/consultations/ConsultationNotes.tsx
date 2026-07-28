"use client";

import { useState } from "react";
import { addConsultationNotes } from "@/lib/actions/consultations";
import { format } from "date-fns";

interface NotesData {
  id?: string;
  diagnosis?: string | null;
  treatment?: string | null;
  prescription?: string | null;
  advice?: string | null;
  followUpDate?: string | null;
}

export function ConsultationNotes({ consultationId, existing }: { consultationId: string; existing?: NotesData | null }) {
  const [diagnosis, setDiagnosis] = useState(existing?.diagnosis || "");
  const [treatment, setTreatment] = useState(existing?.treatment || "");
  const [prescription, setPrescription] = useState(existing?.prescription || "");
  const [advice, setAdvice] = useState(existing?.advice || "");
  const [followUpDate, setFollowUpDate] = useState(existing?.followUpDate || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await addConsultationNotes(consultationId, { diagnosis, treatment, prescription, advice, followUpDate: followUpDate || undefined });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Diagnosis</label>
        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          rows={2}
          className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Treatment Plan</label>
        <textarea
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          rows={2}
          className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Prescription</label>
        <textarea
          value={prescription}
          onChange={(e) => setPrescription(e.target.value)}
          rows={2}
          placeholder="Medication, dosage, frequency..."
          className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Advice</label>
        <textarea
          value={advice}
          onChange={(e) => setAdvice(e.target.value)}
          rows={2}
          className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Follow-up Date</label>
        <input
          type="date"
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
          className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-4 py-2.5 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save Notes"}
      </button>
    </div>
  );
}
