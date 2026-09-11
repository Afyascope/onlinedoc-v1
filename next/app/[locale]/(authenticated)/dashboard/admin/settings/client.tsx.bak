"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { IconSettings, IconPlus, IconX, IconCheck } from "@tabler/icons-react";
import { upsertSetting } from "@/lib/actions/admin";

interface Setting {
  id: string;
  key: string;
  value: string;
  type: string;
  description: string | null;
}

export function AdminSettingsClient({ settings: initial }: { settings: Setting[] }) {
  const [list, setList] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ key: "", value: "", type: "string", description: "" });
  const [saving, setSaving] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const handleSave = async (s: Setting) => {
    setSaving(true);
    await upsertSetting({ id: s.id, key: s.key, value: s.value, type: s.type, description: s.description || "" });
    setSavedKey(s.key);
    setTimeout(() => setSavedKey(null), 2000);
    setSaving(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.key || !form.value) return;
    setSaving(true);
    await upsertSetting({ key: form.key, value: form.value, type: form.type, description: form.description });
    setList((prev) => [...prev, { id: Date.now().toString(), ...form }]);
    setShowForm(false);
    setForm({ key: "", value: "", type: "string", description: "" });
    setSaving(false);
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader
        title="Settings"
        description="Platform-wide configuration"
      />

      <DashboardShell>
        <ActivityCard
          title="Platform Settings"
          action={
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-lg transition-colors"
            >
              <IconPlus size={16} />
              Add Setting
            </button>
          }
        >
          {showForm && (
            <form onSubmit={handleCreate} className="mb-6 p-4 rounded-xl border-2 border-brand/20 bg-brand/5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-primary">New Setting</p>
                <button type="button" onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-neutral-600">
                  <IconX size={18} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-500">Key *</label>
                  <input type="text" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} required
                    className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono text-xs" />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                    <option value="string">string</option>
                    <option value="boolean">boolean</option>
                    <option value="number">number</option>
                    <option value="json">json</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-neutral-500">Value *</label>
                  <input type="text" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required
                    className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-neutral-500">Description</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-50">
                {saving ? "Creating..." : "Create Setting"}
              </button>
            </form>
          )}

          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <IconSettings size={40} stroke={1.5} />
              <p className="mt-3 text-sm text-neutral-500 font-secondary">No settings configured yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((s) => (
                <div key={s.id} className="p-4 rounded-xl border border-border hover:border-brand/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-primary">{s.key}</span>
                        <span className="px-1.5 py-0.5 rounded text-xs bg-neutral-100 text-neutral-600">{s.type}</span>
                      </div>
                      <input
                        type="text"
                        value={s.value}
                        onChange={(e) => {
                          setList((prev) => prev.map((x) => x.id === s.id ? { ...x, value: e.target.value } : x));
                        }}
                        className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono text-xs"
                      />
                      {s.description && (
                        <p className="text-xs text-neutral-400">{s.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleSave({ ...s, value: list.find((x) => x.id === s.id)?.value || s.value })}
                      disabled={saving}
                      className="shrink-0 px-3 py-1.5 text-xs font-medium text-brand bg-brand/5 hover:bg-brand/10 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {savedKey === s.key ? <><IconCheck size={14} /> Saved</> : "Save"}
                    </button>
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
