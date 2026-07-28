"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { IconCalendarDue, IconPlus, IconX } from "@tabler/icons-react";
import { bookAppointment, getAvailableClinicians } from "@/lib/actions/appointments";
import { format } from "date-fns";

interface Appointment {
  id: string;
  clinicianId: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  duration: number | null;
  type: string;
  status: string;
  notes: string | null;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700",
  confirmed: "bg-green-50 text-green-700",
  completed: "bg-neutral-100 text-neutral-600",
  cancelled: "bg-red-50 text-red-600",
};

export function PatientAppointmentsClient({ appointments: initial }: { appointments: Appointment[]; userId: string }) {
  const [list, setList] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [clinicians, setClinicians] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ clinicianId: "", title: "", date: "", time: "", type: "in_person" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (showForm) {
      getAvailableClinicians().then(setClinicians);
    }
  }, [showForm]);

  const upcoming = list.filter((a) => a.status === "scheduled" || a.status === "confirmed");
  const past = list.filter((a) => a.status === "completed" || a.status === "cancelled");

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clinicianId || !form.title || !form.date) {
      setFormError("Please fill in required fields");
      return;
    }
    setSaving(true);
    setFormError("");
    const result = await bookAppointment(form);
    if (result.error) {
      setFormError(result.error);
    } else {
      setList((prev) => [...prev, { ...form, id: Date.now().toString(), description: null, duration: null, notes: null, status: "scheduled" }]);
      setShowForm(false);
      setForm({ clinicianId: "", title: "", date: "", time: "", type: "in_person" });
    }
    setSaving(false);
  };

  return (
    <AuthGuard allowedRoles={["patient"]}>
      <DashboardHeader
        title="Appointments"
        description="Manage your medical appointments"
      />

      <DashboardShell>
        <ActivityCard
          title="Upcoming Appointments"
          action={
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-lg transition-colors"
            >
              <IconPlus size={16} />
              Book New
            </button>
          }
        >
          {upcoming.length === 0 && !showForm ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <IconCalendarDue size={40} stroke={1.5} />
              <p className="mt-3 text-sm text-neutral-500 font-secondary">No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {showForm && (
                <form onSubmit={handleBook} className="p-4 rounded-xl border-2 border-brand/20 bg-brand/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-primary">Book New Appointment</p>
                    <button type="button" onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-neutral-600">
                      <IconX size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-neutral-500">Clinician *</label>
                      <select
                        value={form.clinicianId}
                        onChange={(e) => setForm({ ...form, clinicianId: e.target.value })}
                        required
                        className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      >
                        <option value="">Select a clinician</option>
                        {clinicians.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-neutral-500">Title *</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. Annual checkup"
                        required
                        className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500">Date *</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        required
                        className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500">Time</label>
                      <input
                        type="time"
                        value={form.time}
                        onChange={(e) => setForm({ ...form, time: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-neutral-500">Type</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      >
                        <option value="in_person">In Person</option>
                        <option value="video">Video Call</option>
                      </select>
                    </div>
                  </div>
                  {formError && <p className="text-xs text-red-500">{formError}</p>}
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-50"
                  >
                    {saving ? "Booking..." : "Confirm Booking"}
                  </button>
                </form>
              )}
              {upcoming.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-brand/20 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-primary">{a.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {format(new Date(a.date), "MMM d, yyyy")}
                      {a.time && ` at ${a.time.slice(0, 5)}`}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[a.status] || "bg-neutral-100 text-neutral-600"}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ActivityCard>

        <ActivityCard title="Past Appointments">
          {past.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <IconCalendarDue size={40} stroke={1.5} />
              <p className="mt-3 text-sm text-neutral-500 font-secondary">No past appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {past.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-border">
                  <div>
                    <p className="text-sm font-semibold text-primary">{a.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {format(new Date(a.date), "MMM d, yyyy")}
                      {a.time && ` at ${a.time.slice(0, 5)}`}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[a.status] || "bg-neutral-100 text-neutral-600"}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ActivityCard>
      </DashboardShell>
    </AuthGuard>
  );
}
