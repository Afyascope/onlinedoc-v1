"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { IconSettings, IconRefresh } from "@tabler/icons-react";
import { getPlatformSettings, updatePlatformSetting, seedPlatformSettings } from "@/lib/actions/admin";

export default function SettingsPage() {
  return <SettingsClient />;
}

function SettingsClient() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState("general");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPlatformSettings();
      setSettings(res);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleUpdate = async (id: string, value: string) => {
    setSaving(id);
    setSettings((prev) => prev.map((s) => s.id === id ? { ...s, value } : s));
    await updatePlatformSetting(id, value);
    setSaving(null);
  };

  const handleSeed = async () => {
    await seedPlatformSettings();
    fetch();
  };

  const groups: string[] = settings.reduce((acc: string[], s) => {
    if (!acc.includes(s.group)) acc.push(s.group);
    return acc;
  }, []);

  const filtered = settings.filter((s) => s.group === activeGroup);

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader
        title="Platform Settings"
        description="Configure platform-wide settings"
      />

      <DashboardShell>
        <div className="flex gap-2 flex-wrap mb-2">
          {groups.map((g) => (
            <button key={g} onClick={() => setActiveGroup(g)}
              className={`px-4 py-2 text-sm font-medium rounded-xl capitalize transition-colors ${
                activeGroup === g
                  ? "bg-brand text-white"
                  : "bg-white border border-border text-neutral-600 hover:border-brand/20"
              }`}>
              {g}
            </button>
          ))}
          {settings.length === 0 && !loading && (
            <button onClick={handleSeed}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand bg-brand/5 hover:bg-brand/10 rounded-xl transition-colors">
              <IconRefresh size={16} /> Seed Default Settings
            </button>
          )}
        </div>

        <ActivityCard title={activeGroup.charAt(0).toUpperCase() + activeGroup.slice(1)}>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
              <IconSettings size={40} stroke={1.5} />
              <p className="mt-2 text-sm text-neutral-500">No settings in this group</p>
              <button onClick={handleSeed}
                className="mt-4 px-4 py-2 text-sm font-medium text-brand bg-brand/5 hover:bg-brand/10 rounded-xl transition-colors">
                Seed Default Settings
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-medium text-primary">{s.label || s.key}</p>
                    {s.description && <p className="text-xs text-neutral-500 mt-0.5">{s.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {s.type === "boolean" ? (
                      <button
                        onClick={() => handleUpdate(s.id, s.value === "true" ? "false" : "true")}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          s.value === "true" ? "bg-brand" : "bg-neutral-200"
                        }`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          s.value === "true" ? "translate-x-6" : "translate-x-0.5"
                        }`} />
                      </button>
                    ) : (
                      <input
                        key={s.id + s.value}
                        type={s.type === "number" ? "number" : "text"}
                        defaultValue={s.value}
                        onBlur={(e) => {
                          if (e.target.value !== s.value) handleUpdate(s.id, e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          }
                        }}
                        className="w-48 px-3 py-1.5 text-sm border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                      />
                    )}
                    {saving === s.id && (
                      <div className="h-4 w-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ActivityCard>
      </DashboardShell>
    </AuthGuard>
  );
}
