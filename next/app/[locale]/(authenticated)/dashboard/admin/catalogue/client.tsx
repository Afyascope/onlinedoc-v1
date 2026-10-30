"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardShell, MetricGrid } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  activateCatalogueReleaseAction,
  approveCatalogueReleaseAction,
  confirmCatalogueImportAction,
  listCatalogueResourcesAction,
  previewCatalogueImportAction,
  retireCatalogueReleaseAction,
  setCatalogueResourceActiveAction,
} from "@/lib/actions/catalogue-admin";
import {
  IconBrain,
  IconFlask,
  IconScan,
  IconPill,
  IconUpload,
  IconHistory,
  IconDatabase,
  IconRefresh,
  IconAlertTriangle,
  IconCheck,
  IconFileSpreadsheet,
  IconDownload,
} from "@tabler/icons-react";
import { format } from "date-fns";

type Domain = "diagnosis" | "laboratory" | "radiology" | "medication";

interface OverviewRow {
  domain: Domain;
  label: string;
  activeCount: number;
  inactiveCount: number;
  currentRelease: { id: string; sourceVersion: string | null; sourceName: string | null; activatedAt: Date | null; fileName: string } | null;
  lastImport: { id: string; fileName: string; status: string; createdAt: Date } | null;
  lastUpdated: Date | null;
}

interface ReleaseRow {
  id: string;
  domain: string;
  fileName: string;
  fileChecksum: string;
  fileSize: number | null;
  sourceName: string | null;
  sourceVersion: string | null;
  status: string;
  rowCount: number;
  validRowCount: number;
  invalidRowCount: number;
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  errorCount: number;
  warningCount: number;
  importedByName?: string | null;
  createdAt: Date;
  validatedAt: Date | null;
  approvedAt: Date | null;
  activatedAt: Date | null;
  retiredAt: Date | null;
}

interface Preview {
  releaseId: string;
  domain: Domain;
  fileName: string;
  checksum: string;
  fileType: "xlsx" | "csv";
  fileSize: number;
  rowCount: number;
  validRowCount: number;
  invalidRowCount: number;
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  errorCount: number;
  warningCount: number;
  errors: { row: number; field?: string; code: string; message: string; severity: string }[];
  warnings: { row: number; field?: string; code: string; message: string; severity: string }[];
  unknownColumns: string[];
  fileWarnings: string[];
  canConfirm: boolean;
}

interface ResourceRow {
  id: string;
  stableIdentifier: string;
  code: string | null;
  name: string;
  lifecycle: string;
  isActive: boolean;
  source: string | null;
  sourceIdentifier: string | null;
  sourceVersion: string | null;
  category: string | null;
  modality: string | null;
  specimen: string | null;
  strength: string | null;
  dosageForm: string | null;
  route: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const DOMAIN_LABELS: Record<Domain, string> = {
  diagnosis: "Diagnoses",
  laboratory: "Laboratory tests",
  radiology: "Radiology services",
  medication: "Medications",
};

const DOMAIN_ICONS: Record<Domain, React.ReactNode> = {
  diagnosis: <IconBrain size={20} />,
  laboratory: <IconFlask size={20} />,
  radiology: <IconScan size={20} />,
  medication: <IconPill size={20} />,
};

const TEMPLATE_FILES: Record<Domain, string> = {
  diagnosis: "diagnoses.csv",
  laboratory: "laboratory.csv",
  radiology: "radiology.csv",
  medication: "medications.csv",
};

const TAB_ITEMS = [
  { key: "overview", label: "Overview" },
  { key: "import", label: "Import" },
  { key: "history", label: "Import history" },
  { key: "resources", label: "Resources" },
] as const;

type Tab = (typeof TAB_ITEMS)[number]["key"];

export function CatalogueAdminClient({
  initialOverview,
  initialReleases,
}: {
  initialOverview: OverviewRow[];
  initialReleases: ReleaseRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardHeader
        title="Clinical catalogue"
        description="Administer diagnoses, laboratory tests, radiology services and medications. PostgreSQL is the runtime source of truth."
      />

      <DashboardShell>
        <div className="flex flex-wrap gap-2">
          {TAB_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => { setTab(item.key); setNotice(null); }}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                tab === item.key ? "bg-brand text-white" : "bg-white text-neutral-600 border border-border hover:bg-neutral-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {notice && (
          <div className={`p-4 rounded-xl border text-sm ${
            notice.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
          }`}>
            {notice.message}
          </div>
        )}

        {tab === "overview" && <OverviewTab overview={initialOverview} releases={initialReleases} onNavigate={setTab} />}
        {tab === "import" && (
          <ImportTab
            onNotice={setNotice}
            onImported={() => router.refresh()}
          />
        )}
        {tab === "history" && (
          <HistoryTab releases={initialReleases} onNotice={setNotice} onChanged={() => router.refresh()} />
        )}
        {tab === "resources" && <ResourcesTab onNotice={setNotice} />}
      </DashboardShell>
    </AuthGuard>
  );
}

function OverviewTab({ overview, releases, onNavigate }: { overview: OverviewRow[]; releases: ReleaseRow[]; onNavigate: (tab: Tab) => void }) {
  const totalActive = overview.reduce((sum, row) => sum + row.activeCount, 0);
  const pending = releases.filter((row) => row.status === "validated" || row.status === "approved").length;
  return (
    <div className="space-y-6">
      <MetricGrid columns={4}>
        {overview.map((row) => (
          <MetricCard
            key={row.domain}
            title={row.label}
            value={row.activeCount.toLocaleString()}
            icon={DOMAIN_ICONS[row.domain]}
            description={row.currentRelease ? `Release: ${row.currentRelease.sourceVersion ?? row.currentRelease.fileName}` : "No active release"}
          />
        ))}
      </MetricGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityCard title="Catalogue status">
          <div className="space-y-3">
            {overview.map((row) => (
              <div key={row.domain} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-brand">{DOMAIN_ICONS[row.domain]}</span>
                  <div>
                    <p className="text-sm font-medium text-primary">{row.label}</p>
                    <p className="text-xs text-neutral-500">
                      {row.activeCount} active · {row.inactiveCount} inactive
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-500">{row.currentRelease ? "Active release" : "Not activated"}</p>
                  <p className="text-xs text-neutral-400">
                    {row.lastUpdated ? `Updated ${format(new Date(row.lastUpdated), "MMM d, yyyy")}` : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ActivityCard>

        <ActivityCard title="Administration">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50">
              <div>
                <p className="text-sm font-medium text-primary">Active resources</p>
                <p className="text-xs text-neutral-500">Across all four catalogues</p>
              </div>
              <p className="text-2xl font-bold text-primary">{totalActive.toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50">
              <div>
                <p className="text-sm font-medium text-primary">Releases awaiting activation</p>
                <p className="text-xs text-neutral-500">Validated or approved imports</p>
              </div>
              <p className="text-2xl font-bold text-primary">{pending}</p>
            </div>
            <button
              onClick={() => onNavigate("import")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors"
            >
              <IconUpload size={18} /> Import a catalogue file
            </button>
          </div>
        </ActivityCard>
      </div>
    </div>
  );
}

function ImportTab({ onNotice, onImported }: { onNotice: (value: { type: "success" | "error"; message: string }) => void; onImported: () => void }) {
  const [domain, setDomain] = useState<Domain>("diagnosis");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [validating, setValidating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleValidate = async () => {
    if (!file) {
      onNotice({ type: "error", message: "Select an .xlsx or .csv file first." });
      return;
    }
    setValidating(true);
    setPreview(null);
    try {
      const formData = new FormData();
      formData.set("domain", domain);
      formData.set("file", file);
      const result = await previewCatalogueImportAction(formData);
      if (!result.success) {
        onNotice({ type: "error", message: result.error });
        return;
      }
      setPreview(result.preview);
      onNotice({
        type: result.preview.invalidRowCount === 0 ? "success" : "error",
        message: result.preview.invalidRowCount === 0
          ? "File validated. Review the preview, then confirm the import."
          : "The file was validated but contains errors. Fix the source file before importing.",
      });
    } catch (error) {
      onNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to validate the file." });
    } finally {
      setValidating(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setConfirming(true);
    try {
      const result = await confirmCatalogueImportAction(preview.releaseId);
      if (!result.success) {
        onNotice({ type: "error", message: result.error });
        return;
      }
      onNotice({ type: "success", message: `Import validated. ${result.result.imported} new, ${result.result.updated} updated, ${result.result.unchanged} unchanged resources staged in release ${preview.releaseId.slice(0, 8)}. Approve and activate the release when ready.` });
      setPreview(null);
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      onImported();
    } catch (error) {
      onNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to confirm the import." });
    } finally {
      setConfirming(false);
    }
  };

  const fields = useMemo(() => {
    const base = ["Resource ID", "Name", "Code", "Coding system", "Coding system version", "Description", "Synonyms", "Category", "Source", "Source identifier", "Source version", "Source URL", "Provenance notes", "Effective from", "Effective to", "Active", "Notes"];
    if (domain === "laboratory") return [...base, "Specimen"];
    if (domain === "radiology") return [...base, "Modality"];
    if (domain === "medication") return [...base, "Generic name", "Brand name", "Active ingredient", "Strength", "Dosage form", "Route"];
    return base;
  }, [domain]);

  return (
    <div className="space-y-6">
      <ActivityCard title="Upload and validate">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Resource type</span>
              <select
                value={domain}
                onChange={(event) => { setDomain(event.target.value as Domain); setPreview(null); }}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              >
                {(Object.keys(DOMAIN_LABELS) as Domain[]).map((value) => (
                  <option key={value} value={value}>{DOMAIN_LABELS[value]}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Approved source file (.xlsx or .csv)</span>
              <input
                ref={fileInput}
                type="file"
                accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPreview(null); }}
                className="block w-full text-sm text-neutral-600 file:mr-3 file:px-3 file:py-2 file:rounded-xl file:border-0 file:bg-brand/5 file:text-brand hover:file:bg-brand/10"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleValidate}
              disabled={validating || !file}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-50"
            >
              <IconUpload size={16} /> {validating ? "Validating..." : "Validate file"}
            </button>
            <a
              href={`/catalogue-templates/${TEMPLATE_FILES[domain]}`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand bg-brand/5 hover:bg-brand/10 rounded-xl transition-colors"
            >
              <IconDownload size={16} /> Download CSV template
            </a>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Expected columns for {DOMAIN_LABELS[domain]}</p>
            <p className="text-xs text-neutral-600 leading-relaxed">
              <span className="font-medium text-primary">Required:</span> Resource ID, Name.
              <br />
              <span className="font-medium text-primary">Optional:</span> {fields.filter((field) => field !== "Resource ID" && field !== "Name").join(", ")}.
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              Use ISO dates (YYYY-MM-DD). Files are limited to 10 MB and 10,000 data rows. Formulas are never executed.
            </p>
          </div>
        </div>
      </ActivityCard>

      {preview && (
        <ActivityCard title="Import preview">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">{DOMAIN_LABELS[preview.domain]} import</p>
                <p className="text-xs text-neutral-500">{preview.fileName} · {preview.fileType.toUpperCase()} · sha256 {preview.checksum.slice(0, 16)}...</p>
              </div>
              <StatusBadge status={preview.canConfirm ? "validated" : "failed"} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <PreviewMetric label="Rows detected" value={preview.rowCount} />
              <PreviewMetric label="Valid" value={preview.validRowCount} tone="good" />
              <PreviewMetric label="Invalid" value={preview.invalidRowCount} tone={preview.invalidRowCount > 0 ? "bad" : "neutral"} />
              <PreviewMetric label="Warnings" value={preview.warningCount} tone={preview.warningCount > 0 ? "warn" : "neutral"} />
              <PreviewMetric label="New" value={preview.newCount} />
              <PreviewMetric label="Updates" value={preview.updatedCount} />
              <PreviewMetric label="Unchanged" value={preview.unchangedCount} />
              <PreviewMetric label="Errors" value={preview.errorCount} tone={preview.errorCount > 0 ? "bad" : "neutral"} />
            </div>

            {(preview.errors.length > 0 || preview.warnings.length > 0 || preview.fileWarnings.length > 0) && (
              <div className="space-y-3">
                {preview.errors.length > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-red-800"><IconAlertTriangle size={16} /> Validation errors</p>
                    <ul className="mt-2 space-y-1 text-xs text-red-700 max-h-48 overflow-y-auto">
                      {preview.errors.map((error, index) => (
                        <li key={`${error.code}-${error.row}-${index}`}>
                          {error.row > 0 ? `Row ${error.row}: ` : ""}{error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(preview.warnings.length > 0 || preview.fileWarnings.length > 0) && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-medium text-amber-800">Warnings</p>
                    <ul className="mt-2 space-y-1 text-xs text-amber-700 max-h-40 overflow-y-auto">
                      {[...preview.fileWarnings.map((message) => ({ row: 0, message })), ...preview.warnings].map((warning, index) => (
                        <li key={`${warning.row}-${index}`}>{warning.row > 0 ? `Row ${warning.row}: ` : ""}{warning.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleConfirm}
                disabled={!preview.canConfirm || confirming}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50"
              >
                <IconCheck size={16} /> {confirming ? "Importing..." : "Confirm import"}
              </button>
              <button
                onClick={() => setPreview(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <p className="text-xs text-neutral-500">
                Confirming stages a validated release. Nothing becomes clinician-visible until the release is approved and activated.
              </p>
            </div>
          </div>
        </ActivityCard>
      )}
    </div>
  );
}

function PreviewMetric({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "good" | "bad" | "warn" }) {
  const color = tone === "good" ? "text-green-700" : tone === "bad" ? "text-red-700" : tone === "warn" ? "text-amber-700" : "text-primary";
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}

function HistoryTab({ releases, onNotice, onChanged }: { releases: ReleaseRow[]; onNotice: (value: { type: "success" | "error"; message: string }) => void; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [retireTarget, setRetireTarget] = useState<ReleaseRow | null>(null);

  const run = async (id: string, action: () => Promise<{ success: boolean; error?: string }>, success: string) => {
    setBusy(id);
    try {
      const result = await action();
      if (!result.success) {
        onNotice({ type: "error", message: result.error ?? "Action failed." });
        return;
      }
      onNotice({ type: "success", message: success });
      onChanged();
    } catch (error) {
      onNotice({ type: "error", message: error instanceof Error ? error.message : "Action failed." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <ActivityCard title="Import history">
      {releases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
          <IconHistory size={36} stroke={1.5} />
          <p className="mt-3 text-sm text-neutral-500">No catalogue imports yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-border">
                {["Date", "Domain", "File", "Checksum", "Rows", "Result", "Status", "Administrator", "Actions"].map((header) => (
                  <th key={header} className="text-left py-3 px-3 text-xs font-medium text-neutral-500 uppercase tracking-wide whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {releases.map((release) => (
                <tr key={release.id} className="border-b border-border last:border-0 hover:bg-neutral-50 align-top">
                  <td className="py-3 px-3 text-xs text-neutral-600 whitespace-nowrap">{format(new Date(release.createdAt), "MMM d, yyyy HH:mm")}</td>
                  <td className="py-3 px-3 text-xs text-neutral-600">{DOMAIN_LABELS[release.domain as Domain] ?? release.domain}</td>
                  <td className="py-3 px-3 text-xs text-neutral-600 max-w-[180px] truncate" title={release.fileName}>{release.fileName}</td>
                  <td className="py-3 px-3 text-xs font-mono text-neutral-500">{release.fileChecksum.slice(0, 10)}...</td>
                  <td className="py-3 px-3 text-xs text-neutral-600">{release.validRowCount}/{release.rowCount}</td>
                  <td className="py-3 px-3 text-xs text-neutral-600">
                    {release.newCount} new<br />{release.updatedCount} updated<br />{release.unchangedCount} unchanged
                  </td>
                  <td className="py-3 px-3"><StatusBadge status={release.status} /></td>
                  <td className="py-3 px-3 text-xs text-neutral-600">{release.importedByName ?? "—"}</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1.5">
                      {release.status === "validated" && (
                        <button
                          onClick={() => run(release.id, () => approveCatalogueReleaseAction(release.id), "Release approved.")}
                          disabled={busy === release.id}
                          className="px-2 py-1 text-xs font-medium text-brand bg-brand/5 hover:bg-brand/10 rounded-lg disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {release.status === "approved" && (
                        <button
                          onClick={() => run(release.id, () => activateCatalogueReleaseAction(release.id), "Release activated. Clinicians can now search these resources.")}
                          disabled={busy === release.id}
                          className="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
                        >
                          Activate
                        </button>
                      )}
                      {release.status === "active" && (
                        <button
                          onClick={() => setRetireTarget(release)}
                          disabled={busy === release.id}
                          className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50"
                        >
                          Retire
                        </button>
                      )}
                      {release.status === "draft" && <span className="text-xs text-neutral-400">Pending confirmation</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(retireTarget)}
        title="Retire catalogue release?"
        message="Retiring the active release removes its resources from clinician search. Historical consultation snapshots are not changed."
        confirmLabel="Retire release"
        variant="danger"
        loading={Boolean(retireTarget && busy === retireTarget.id)}
        onCancel={() => setRetireTarget(null)}
        onConfirm={async () => {
          if (!retireTarget) return;
          await run(retireTarget.id, () => retireCatalogueReleaseAction(retireTarget.id, "Retired by administrator"), "Release retired.");
          setRetireTarget(null);
        }}
      />
    </ActivityCard>
  );
}

function ResourcesTab({ onNotice }: { onNotice: (value: { type: "success" | "error"; message: string }) => void }) {
  const [domain, setDomain] = useState<Domain>("diagnosis");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("active");
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [release, setRelease] = useState<{ id: string; status: string; sourceVersion: string | null; fileName: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const search = async (nextDomain = domain, nextQuery = query, nextStatus = status) => {
    setLoading(true);
    try {
      const result = await listCatalogueResourcesAction({ domain: nextDomain, query: nextQuery, status: nextStatus });
      setLoaded(true);
      setRelease(result.release);
      setResources(result.resources as ResourceRow[]);
    } catch (error) {
      onNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to load resources." });
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (resource: ResourceRow) => {
    setBusyId(resource.id);
    try {
      const result = await setCatalogueResourceActiveAction({
        resourceId: resource.id,
        active: resource.lifecycle !== "active",
        reason: resource.lifecycle === "active" ? "Deactivated by administrator" : "Reactivated by administrator",
      });
      if (!result.success) {
        onNotice({ type: "error", message: result.error });
        return;
      }
      onNotice({ type: "success", message: resource.lifecycle === "active" ? "Resource deactivated." : "Resource reactivated." });
      await search();
    } catch (error) {
      onNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to update the resource." });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <ActivityCard title="Resource browser">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={domain}
            onChange={(event) => { const next = event.target.value as Domain; setDomain(next); void search(next, query, status); }}
            className="px-3 py-2 text-sm border border-border rounded-xl bg-white"
          >
            {(Object.keys(DOMAIN_LABELS) as Domain[]).map((value) => <option key={value} value={value}>{DOMAIN_LABELS[value]}</option>)}
          </select>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") void search(); }}
            placeholder="Search name, code or source identifier"
            className="md:col-span-2 px-3 py-2 text-sm border border-border rounded-xl bg-white"
          />
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(event) => { const next = event.target.value as typeof status; setStatus(next); void search(domain, query, next); }}
              className="flex-1 px-3 py-2 text-sm border border-border rounded-xl bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </select>
            <button
              onClick={() => void search()}
              disabled={loading}
              className="px-3 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-xl disabled:opacity-50"
            >
              <IconRefresh size={16} />
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-neutral-500">
          {release ? `Release ${release.id.slice(0, 8)} · ${release.status} · ${release.sourceVersion ?? release.fileName}` : loaded ? "No release exists for this catalogue yet." : "Search the active release to inspect resources and provenance."}
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-border">
                {["Name", "Code", "Source", "Lifecycle", "Updated", "Actions"].map((header) => (
                  <th key={header} className="text-left py-3 px-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                    <IconDatabase size={28} className="mx-auto text-neutral-300" />
                    <p className="mt-2">{loaded ? "No matching resources" : "Run a search to view resources"}</p>
                  </td>
                </tr>
              ) : resources.map((resource) => (
                <tr key={resource.id} className="border-b border-border last:border-0 hover:bg-neutral-50 align-top">
                  <td className="py-3 px-3">
                    <p className="text-sm font-medium text-primary">{resource.name}</p>
                    <p className="text-xs text-neutral-500">{resource.stableIdentifier}{resource.category ? ` · ${resource.category}` : ""}{resource.modality ? ` · ${resource.modality}` : ""}{resource.strength ? ` · ${resource.strength}` : ""}</p>
                  </td>
                  <td className="py-3 px-3 text-xs text-neutral-600">{resource.code ?? "—"}</td>
                  <td className="py-3 px-3 text-xs text-neutral-600">
                    {resource.source ?? "—"}
                    {resource.sourceVersion ? <span className="block text-neutral-400">{resource.sourceVersion}</span> : null}
                  </td>
                  <td className="py-3 px-3"><StatusBadge status={resource.lifecycle} /></td>
                  <td className="py-3 px-3 text-xs text-neutral-500">{format(new Date(resource.updatedAt), "MMM d, yyyy")}</td>
                  <td className="py-3 px-3">
                    {release?.status === "active" ? (
                      <button
                        onClick={() => void toggle(resource)}
                        disabled={busyId === resource.id}
                        className={`px-2 py-1 text-xs font-medium rounded-lg disabled:opacity-50 ${
                          resource.lifecycle === "active"
                            ? "text-red-700 bg-red-50 hover:bg-red-100"
                            : "text-green-700 bg-green-50 hover:bg-green-100"
                        }`}
                      >
                        {resource.lifecycle === "active" ? "Deactivate" : "Reactivate"}
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-400">Read only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ActivityCard>
    </div>
  );
}
