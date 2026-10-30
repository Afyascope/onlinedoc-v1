"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { assertAdminRole } from "@/lib/admin-authorization";
import { isCatalogueDomain, type CatalogueDomain } from "@/lib/catalogue/domains";
import {
  activateCatalogueRelease,
  approveCatalogueRelease,
  confirmCatalogueImport,
  getCatalogueOverview,
  getCatalogueResourceHistory,
  listAdminResources,
  listCatalogueReleases,
  previewCatalogueImport,
  retireCatalogueRelease,
  setCatalogueResourceActive,
} from "@/lib/catalogue/service";

async function getAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Not authenticated");
  assertAdminRole(session.user.role);
  return session;
}

async function audit(
  action: string,
  target: string,
  targetId: string,
  metadata: Record<string, unknown>,
  actorId: string,
) {
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    action,
    target,
    targetId,
    userId: actorId,
    metadata: JSON.parse(JSON.stringify(metadata)),
    createdAt: new Date(),
  });
}

function revalidateCataloguePaths() {
  revalidatePath("/dashboard/admin/catalogue");
  revalidatePath("/dashboard/clinician");
  revalidatePath("/dashboard/clinician/consultations");
}

function parseDomain(value: FormDataEntryValue | null): CatalogueDomain {
  if (typeof value !== "string" || !isCatalogueDomain(value)) {
    throw new Error("Select a supported catalogue resource type.");
  }
  return value;
}

export async function getCatalogueAdminOverview() {
  await getAdminSession();
  return getCatalogueOverview();
}

export async function getCatalogueImportHistory(domain?: CatalogueDomain) {
  await getAdminSession();
  const rows = await listCatalogueReleases(domain);
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt,
    activatedAt: row.activatedAt,
    approvedAt: row.approvedAt,
    validatedAt: row.validatedAt,
    retiredAt: row.retiredAt,
  }));
}

export async function previewCatalogueImportAction(formData: FormData) {
  try {
    const session = await getAdminSession();
    const domain = parseDomain(formData.get("domain"));
    const file = formData.get("file");
    if (!(file instanceof File)) return { success: false as const, error: "Select a file to upload." };

    const preview = await previewCatalogueImport({ file, domain, actorId: session.user.id });
    await audit("catalogue_import_previewed", "catalogue_release", preview.releaseId, {
      domain,
      fileName: preview.fileName,
      checksum: preview.checksum,
      rowCount: preview.rowCount,
      validRowCount: preview.validRowCount,
      invalidRowCount: preview.invalidRowCount,
      canConfirm: preview.canConfirm,
    }, session.user.id);
    revalidateCataloguePaths();
    return { success: true as const, preview };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Unable to validate the uploaded file." };
  }
}

export async function confirmCatalogueImportAction(releaseId: string) {
  try {
    const session = await getAdminSession();
    const result = await confirmCatalogueImport({ releaseId, actorId: session.user.id });
    await audit("catalogue_import_confirmed", "catalogue_release", releaseId, {
      imported: result.imported,
      updated: result.updated,
      unchanged: result.unchanged,
    }, session.user.id);
    revalidateCataloguePaths();
    return { success: true as const, result };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Unable to import the catalogue release." };
  }
}

export async function approveCatalogueReleaseAction(releaseId: string) {
  try {
    const session = await getAdminSession();
    await approveCatalogueRelease({ releaseId, actorId: session.user.id });
    await audit("catalogue_release_approved", "catalogue_release", releaseId, {}, session.user.id);
    revalidateCataloguePaths();
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Unable to approve the catalogue release." };
  }
}

export async function activateCatalogueReleaseAction(releaseId: string) {
  try {
    const session = await getAdminSession();
    await activateCatalogueRelease({ releaseId, actorId: session.user.id });
    await audit("catalogue_release_activated", "catalogue_release", releaseId, {}, session.user.id);
    revalidateCataloguePaths();
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Unable to activate the catalogue release." };
  }
}

export async function retireCatalogueReleaseAction(releaseId: string, reason?: string) {
  try {
    const session = await getAdminSession();
    await retireCatalogueRelease({ releaseId, actorId: session.user.id, reason });
    await audit("catalogue_release_retired", "catalogue_release", releaseId, { reason: reason ?? null }, session.user.id);
    revalidateCataloguePaths();
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Unable to retire the catalogue release." };
  }
}

export async function listCatalogueResourcesAction(filters: {
  domain: CatalogueDomain;
  query?: string;
  status?: "all" | "active" | "inactive";
  releaseId?: string;
}) {
  await getAdminSession();
  if (!isCatalogueDomain(filters.domain)) throw new Error("Unsupported catalogue domain");
  return listAdminResources(filters);
}

export async function setCatalogueResourceActiveAction(input: {
  resourceId: string;
  active: boolean;
  reason?: string;
}) {
  try {
    const session = await getAdminSession();
    await setCatalogueResourceActive({
      resourceId: input.resourceId,
      active: input.active,
      actorId: session.user.id,
      reason: input.reason,
    });
    await audit(input.active ? "catalogue_resource_reactivated" : "catalogue_resource_deactivated", "catalogue_resource", input.resourceId, {
      reason: input.reason ?? null,
    }, session.user.id);
    revalidateCataloguePaths();
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Unable to update the catalogue resource." };
  }
}

export async function getCatalogueResourceHistoryAction(resourceId: string) {
  await getAdminSession();
  return getCatalogueResourceHistory(resourceId);
}
