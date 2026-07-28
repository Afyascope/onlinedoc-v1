"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { IconUser, IconMail, IconCheck, IconX, IconStethoscope, IconCurrencyDollar, IconBriefcase } from "@tabler/icons-react";
import { updateProfileName, changePassword } from "@/lib/actions/profile";
import { updateClinicianProfile } from "@/lib/actions/clinician";

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  clinicianApproved: boolean;
}

interface ClinicianProfile {
  userId: string;
  specialization: string | null;
  qualifications: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  consultationFee: string | null;
  currency: string;
  isAcceptingPatients: boolean;
}

export function ClinicianProfileClient({ user, profile }: { user: ProfileUser | null; profile: ClinicianProfile | null }) {
  const [name, setName] = useState(user?.name || "");
  const [specialization, setSpecialization] = useState(profile?.specialization || "");
  const [qualifications, setQualifications] = useState(profile?.qualifications || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [yearsOfExperience, setYearsOfExperience] = useState(profile?.yearsOfExperience || 0);
  const [consultationFee, setConsultationFee] = useState(profile?.consultationFee || "0");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <AuthGuard allowedRoles={["clinician"]}>
        <DashboardHeader title="Profile" />
        <p className="text-neutral-500">Unable to load profile.</p>
      </AuthGuard>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError("");

    if (name !== user.name) {
      const r = await updateProfileName(name);
      if (r.error) { setError(r.error); setSaving(false); return; }
    }

    const r = await updateClinicianProfile({
      specialization,
      qualifications,
      bio,
      yearsOfExperience,
      consultationFee: Number(consultationFee),
      isAcceptingPatients: true,
    });

    if (r.error) {
      setError(r.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  return (
    <AuthGuard allowedRoles={["clinician"]}>
      <DashboardHeader
        title="Profile"
        description="Manage your professional information"
      />

      <DashboardShell>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityCard title="Personal Information">
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center text-brand text-2xl font-bold font-primary">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
                <IconMail size={18} className="text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">Email</p>
                  <p className="text-sm font-medium text-primary">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {user.emailVerified ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600"><IconCheck size={14} /> Verified</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600"><IconX size={14} /> Not verified</span>
                  )}
                </div>
                {user.clinicianApproved ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600"><IconCheck size={14} /> Approved</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600"><IconX size={14} /> Pending</span>
                )}
              </div>
            </div>
          </ActivityCard>

          <ActivityCard title="Professional Details">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Specialization</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Cardiology"
                  className="mt-1.5 w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Qualifications</label>
                <input
                  type="text"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="e.g. MD, PhD"
                  className="mt-1.5 w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Years Experience</label>
                  <input
                    type="number"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                    min={0}
                    className="mt-1.5 w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Fee ($)</label>
                  <input
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    min={0}
                    step={0.01}
                    className="mt-1.5 w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Brief professional bio..."
                  className="mt-1.5 w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </ActivityCard>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
