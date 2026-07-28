"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { IconUser, IconMail, IconShield, IconCheck, IconX, IconLock } from "@tabler/icons-react";
import { updateProfileName, changePassword } from "@/lib/actions/profile";

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
}

export function PatientProfileClient({ user }: { user: ProfileUser | null }) {
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  if (!user) {
    return (
      <AuthGuard allowedRoles={["patient"]}>
        <DashboardHeader title="Profile" />
        <p className="text-neutral-500">Unable to load profile.</p>
      </AuthGuard>
    );
  }

  const handleSave = async () => {
    if (name === user.name) return;
    setSaving(true);
    setSaveError("");
    const result = await updateProfileName(name);
    if (result.error) {
      setSaveError(result.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPw(true);
    setPwError("");
    setPwSuccess(false);
    const result = await changePassword(currentPassword, newPassword);
    if (result.error) {
      setPwError(result.error);
    } else {
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setShowPwForm(false), 1500);
    }
    setChangingPw(false);
  };

  return (
    <AuthGuard allowedRoles={["patient"]}>
      <DashboardHeader
        title="Profile"
        description="Manage your personal information"
      />

      <DashboardShell>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityCard title="Personal Information">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-500 font-secondary uppercase tracking-wide">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 font-secondary uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="mt-1.5 w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-neutral-50 text-neutral-400 cursor-not-allowed"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                {user.emailVerified ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                    <IconCheck size={14} />
                    Email verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                    <IconX size={14} />
                    Email not verified
                  </span>
                )}
              </div>
              {saveError && (
                <p className="text-xs text-red-500">{saveError}</p>
              )}
              <button
                onClick={handleSave}
                disabled={saving || name === user.name}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </ActivityCard>

          <ActivityCard title="Account Details">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
                <IconUser size={18} className="text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">Role</p>
                  <p className="text-sm font-medium text-primary capitalize">{user.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
                <IconMail size={18} className="text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">Email</p>
                  <p className="text-sm font-medium text-primary">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
                <IconShield size={18} className="text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">Account ID</p>
                  <p className="text-sm font-medium text-primary font-mono text-xs">{user.id.slice(0, 12)}...</p>
                </div>
              </div>

              {showPwForm ? (
                <form onSubmit={handleChangePassword} className="space-y-3 pt-2 border-t border-border">
                  <p className="text-sm font-semibold text-primary">Change Password</p>
                  <div>
                    <label className="text-xs text-neutral-500">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                  {pwError && <p className="text-xs text-red-500">{pwError}</p>}
                  {pwSuccess && <p className="text-xs text-green-600">Password changed successfully</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={changingPw}
                      className="px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-50"
                    >
                      {changingPw ? "Changing..." : "Update Password"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowPwForm(false); setPwError(""); }}
                      className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowPwForm(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 rounded-xl transition-colors"
                >
                  <IconLock size={16} />
                  Change Password
                </button>
              )}
            </div>
          </ActivityCard>
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
