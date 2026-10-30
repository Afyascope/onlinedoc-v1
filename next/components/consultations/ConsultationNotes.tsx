"use client";

import { useState } from "react";
import { addConsultationNotes } from "@/lib/actions/consultations";

interface NotesData {
  id?: string;
  historyNotes?: string | null;
  diagnosis?: string | null;
  prescription?: string | null;
  advice?: string | null;
  followUpDate?: string | null;
}

export function ConsultationNotes({ consultationId, existing }: { consultationId: string; existing?: NotesData | null }) {
  const [historyNotes, setHistoryNotes] = useState(existing?.historyNotes || "");
  const [diagnosis, setDiagnosis] = useState(existing?.diagnosis || "");
  const [prescription, setPrescription] = useState(existing?.prescription || "");
  const [advice, setAdvice] = useState(existing?.advice || "");
  const [followUpDate, setFollowUpDate] = useState(existing?.followUpDate || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await addConsultationNotes(consultationId, { historyNotes, diagnosis, prescription, advice, followUpDate: followUpDate || undefined });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">History Notes</label>
        <textarea value={historyNotes} onChange={(event) => setHistoryNotes(event.target.value)} rows={3}
          className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Diagnosis</label>
        <textarea value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} rows={2}
          className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Prescription</label>
        <textarea value={prescription} onChange={(event) => setPrescription(event.target.value)} rows={2}
          className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" />
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
      <button onClick={handleSave} disabled={saving}
        className="w-full px-4 py-2.5 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-50">
        {saving ? "Saving..." : saved ? "Saved!" : "Save Notes"}
      </button>
    </div>
  );
}
