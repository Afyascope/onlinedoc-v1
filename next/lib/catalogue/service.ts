import "server-only";

import crypto from "crypto";
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  catalogueReleases,
  catalogueResourceHistory,
  catalogueResources,
  consultationDiagnoses,
  consultationRequests,
  user,
} from "@/db/schema";
import {
  CATALOGUE_DOMAIN_LABELS,
  CATALOGUE_DOMAINS,
  type CatalogueDomain,
  type CatalogueRow,
  type DocumentType,
  type ReleaseStatus,
} from "./domains";
import { CatalogueFileError, parseCatalogueUpload } from "./import/parse-upload";
import { CATALOGUE_SEARCH_LIMIT, catalogueSearchPatterns } from "./search-query";
import {
  classifyValidatedRows,
  validateCatalogueRows,
  type ImportClassification,
  type ValidationIssue,
  type ValidationSummary,
} from "./validation";

const SEARCH_LIMIT = CATALOGUE_SEARCH_LIMIT;
const ADMIN_PAGE_LIMIT = 100;

export interface CatalogueSearchResult {
  id: string;
  domain: CatalogueDomain;
  stableIdentifier: string;
  code: string | null;
  name: string;
  description: string | null;
  codingSystem: string | null;
  codingSystemVersion: string | null;
  category: string | null;
  specimen: string | null;
  modality: string | null;
  genericName: string | null;
  brandName: string | null;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  route: string | null;
  source: string | null;
  sourceIdentifier: string | null;
  sourceVersion: string | null;
  releaseId: string;
  releaseSourceVersion: string | null;
}

function clampLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit) || !limit || limit < 1) return SEARCH_LIMIT;
  return Math.min(Math.floor(limit), SEARCH_LIMIT);
}

export async function getActiveRelease(domain: CatalogueDomain) {
  const [release] = await db
    .select()
    .from(catalogueReleases)
    .where(and(eq(catalogueReleases.domain, domain), eq(catalogueReleases.status, "active")))
    .orderBy(desc(catalogueReleases.activatedAt))
    .limit(1);
  return release ?? null;
}

export async function searchActiveCatalogue(
  domain: CatalogueDomain,
  query: string,
  limit?: number,
): Promise<CatalogueSearchResult[]> {
  const max = clampLimit(limit);
  const patterns = catalogueSearchPatterns(query);
  if (!patterns) return [];

  const normalized = patterns.value.toLowerCase();
  const prefix = patterns.prefix.toLowerCase();
  const text = {
    name: sql`lower(coalesce(${catalogueResources.name}, ''))`,
    code: sql`lower(coalesce(${catalogueResources.code}, ''))`,
    synonyms: sql`lower(coalesce(${catalogueResources.synonyms}, ''))`,
    sourceIdentifier: sql`lower(coalesce(${catalogueResources.sourceIdentifier}, ''))`,
    genericName: sql`lower(coalesce(${catalogueResources.genericName}, ''))`,
    brandName: sql`lower(coalesce(${catalogueResources.brandName}, ''))`,
    activeIngredient: sql`lower(coalesce(${catalogueResources.activeIngredient}, ''))`,
    category: sql`lower(coalesce(${catalogueResources.category}, ''))`,
    specimen: sql`lower(coalesce(${catalogueResources.specimen}, ''))`,
    modality: sql`lower(coalesce(${catalogueResources.modality}, ''))`,
  };
  const rank = sql<number>`case
    when ${text.name} = ${normalized} then 0
    when ${text.name} like ${prefix} then 1
    when ${text.code} = ${normalized} then 2
    when ${text.code} like ${prefix} then 3
    when ${text.genericName} = ${normalized} then 4
    when ${text.genericName} like ${prefix} then 5
    when ${text.brandName} = ${normalized} then 6
    when ${text.brandName} like ${prefix} then 7
    when ${text.sourceIdentifier} = ${normalized} then 8
    when ${text.sourceIdentifier} like ${prefix} then 9
    when ${text.synonyms} = ${normalized} then 10
    when ${text.synonyms} like ${prefix} then 11
    when ${text.activeIngredient} = ${normalized} then 12
    when ${text.activeIngredient} like ${prefix} then 13
    when ${text.category} = ${normalized} then 14
    when ${text.category} like ${prefix} then 15
    when ${text.specimen} = ${normalized} then 16
    when ${text.specimen} like ${prefix} then 17
    when ${text.modality} = ${normalized} then 18
    when ${text.modality} like ${prefix} then 19
    else 20
  end`;

  const rows = await db
    .select({
      id: catalogueResources.id,
      domain: catalogueResources.domain,
      stableIdentifier: catalogueResources.stableIdentifier,
      code: catalogueResources.code,
      name: catalogueResources.name,
      description: catalogueResources.description,
      codingSystem: catalogueResources.codingSystem,
      codingSystemVersion: catalogueResources.codingSystemVersion,
      category: catalogueResources.category,
      specimen: catalogueResources.specimen,
      modality: catalogueResources.modality,
      genericName: catalogueResources.genericName,
      brandName: catalogueResources.brandName,
      activeIngredient: catalogueResources.activeIngredient,
      strength: catalogueResources.strength,
      dosageForm: catalogueResources.dosageForm,
      route: catalogueResources.route,
      source: catalogueResources.source,
      sourceIdentifier: catalogueResources.sourceIdentifier,
      sourceVersion: catalogueResources.sourceVersion,
      releaseId: catalogueReleases.id,
      releaseSourceVersion: catalogueReleases.sourceVersion,
    })
    .from(catalogueResources)
    .innerJoin(catalogueReleases, eq(catalogueResources.releaseId, catalogueReleases.id))
    .where(and(
      eq(catalogueReleases.domain, domain),
      eq(catalogueReleases.status, "active"),
      eq(catalogueResources.domain, domain),
      eq(catalogueResources.lifecycle, "active"),
      eq(catalogueResources.isActive, true),
      or(
        ilike(catalogueResources.name, patterns.contains),
        ilike(catalogueResources.code, patterns.contains),
        ilike(catalogueResources.synonyms, patterns.contains),
        ilike(catalogueResources.sourceIdentifier, patterns.contains),
        ilike(catalogueResources.genericName, patterns.contains),
        ilike(catalogueResources.brandName, patterns.contains),
        ilike(catalogueResources.activeIngredient, patterns.contains),
        ilike(catalogueResources.category, patterns.contains),
        ilike(catalogueResources.specimen, patterns.contains),
        ilike(catalogueResources.modality, patterns.contains),
      ),
    ))
    .orderBy(rank, asc(catalogueResources.name), asc(catalogueResources.id))
    .limit(max);

  return rows.map((row) => ({
    ...row,
    domain: row.domain as CatalogueDomain,
  }));
}

export async function loadSelectableResources(
  domain: CatalogueDomain,
  ids: string[],
): Promise<Map<string, CatalogueSearchResult>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return new Map();
  if (unique.length > 200) throw new Error("Too many catalogue selections");

  const rows = await db
    .select({
      id: catalogueResources.id,
      domain: catalogueResources.domain,
      stableIdentifier: catalogueResources.stableIdentifier,
      code: catalogueResources.code,
      name: catalogueResources.name,
      description: catalogueResources.description,
      codingSystem: catalogueResources.codingSystem,
      codingSystemVersion: catalogueResources.codingSystemVersion,
      category: catalogueResources.category,
      specimen: catalogueResources.specimen,
      modality: catalogueResources.modality,
      genericName: catalogueResources.genericName,
      brandName: catalogueResources.brandName,
      activeIngredient: catalogueResources.activeIngredient,
      strength: catalogueResources.strength,
      dosageForm: catalogueResources.dosageForm,
      route: catalogueResources.route,
      source: catalogueResources.source,
      sourceIdentifier: catalogueResources.sourceIdentifier,
      sourceVersion: catalogueResources.sourceVersion,
      releaseId: catalogueReleases.id,
      releaseSourceVersion: catalogueReleases.sourceVersion,
    })
    .from(catalogueResources)
    .innerJoin(catalogueReleases, eq(catalogueResources.releaseId, catalogueReleases.id))
    .where(and(
      eq(catalogueReleases.domain, domain),
      eq(catalogueReleases.status, "active"),
      eq(catalogueResources.domain, domain),
      eq(catalogueResources.lifecycle, "active"),
      eq(catalogueResources.isActive, true),
      inArray(catalogueResources.id, unique),
    ));

  return new Map(rows.map((row) => [row.id, { ...row, domain: row.domain as CatalogueDomain }]));
}

export interface CatalogueOverviewRow {
  domain: CatalogueDomain;
  label: string;
  activeCount: number;
  inactiveCount: number;
  currentRelease: {
    id: string;
    sourceVersion: string | null;
    sourceName: string | null;
    activatedAt: Date | null;
    fileName: string;
  } | null;
  lastImport: {
    id: string;
    fileName: string;
    status: string;
    createdAt: Date;
  } | null;
  lastUpdated: Date | null;
}

export async function getCatalogueOverview(): Promise<CatalogueOverviewRow[]> {
  const overview: CatalogueOverviewRow[] = [];
  for (const domain of CATALOGUE_DOMAINS) {
    const release = await getActiveRelease(domain);
    let activeCount = 0;
    let inactiveCount = 0;
    let lastUpdated: Date | null = null;
    if (release) {
      const [active] = await db
        .select({ value: count() })
        .from(catalogueResources)
        .where(and(
          eq(catalogueResources.releaseId, release.id),
          eq(catalogueResources.lifecycle, "active"),
        ));
      const [inactive] = await db
        .select({ value: count() })
        .from(catalogueResources)
        .where(and(
          eq(catalogueResources.releaseId, release.id),
          inArray(catalogueResources.lifecycle, ["inactive", "retired"]),
        ));
      activeCount = Number(active?.value ?? 0);
      inactiveCount = Number(inactive?.value ?? 0);
      const [latest] = await db
        .select({ updatedAt: catalogueResources.updatedAt })
        .from(catalogueResources)
        .where(eq(catalogueResources.releaseId, release.id))
        .orderBy(desc(catalogueResources.updatedAt))
        .limit(1);
      lastUpdated = latest?.updatedAt ?? null;
    }

    const [lastImport] = await db
      .select({ id: catalogueReleases.id, fileName: catalogueReleases.fileName, status: catalogueReleases.status, createdAt: catalogueReleases.createdAt })
      .from(catalogueReleases)
      .where(eq(catalogueReleases.domain, domain))
      .orderBy(desc(catalogueReleases.createdAt))
      .limit(1);

    overview.push({
      domain,
      label: CATALOGUE_DOMAIN_LABELS[domain],
      activeCount,
      inactiveCount,
      currentRelease: release ? {
        id: release.id,
        sourceVersion: release.sourceVersion,
        sourceName: release.sourceName,
        activatedAt: release.activatedAt,
        fileName: release.fileName,
      } : null,
      lastImport: lastImport ?? null,
      lastUpdated,
    });
  }
  return overview;
}

export interface ImportPreviewResult {
  releaseId: string;
  domain: CatalogueDomain;
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
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  unknownColumns: string[];
  fileWarnings: string[];
  canConfirm: boolean;
}

export async function previewCatalogueImport(input: {
  file: File;
  domain: CatalogueDomain;
  actorId: string;
}): Promise<ImportPreviewResult> {
  const arrayBuffer = await input.file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

  let parsed;
  try {
    parsed = await parseCatalogueUpload(buffer, input.file.name, input.file.type);
  } catch (error) {
    if (error instanceof CatalogueFileError) throw error;
    throw new CatalogueFileError("Unable to read the uploaded workbook.");
  }

  if (parsed.rows.length === 0) {
    throw new CatalogueFileError("The file does not contain any data rows.");
  }

  const validation = validateCatalogueRows(input.domain, parsed.rows);
  const existing = await existingResourceMap(input.domain);
  const classification = classifyValidatedRows(validation.validRows, existing);

  const [duplicateChecksum] = await db
    .select({ id: catalogueReleases.id, status: catalogueReleases.status })
    .from(catalogueReleases)
    .where(and(
      eq(catalogueReleases.domain, input.domain),
      eq(catalogueReleases.fileChecksum, checksum),
      inArray(catalogueReleases.status, ["validated", "approved", "active"]),
    ))
    .limit(1);

  const fileWarnings = [...parsed.warnings];
  if (duplicateChecksum) {
    fileWarnings.push(`This exact file has already been imported (release ${duplicateChecksum.id.slice(0, 8)}, status ${duplicateChecksum.status}).`);
  }

  const id = crypto.randomUUID();
  const now = new Date();
  const sourceName = firstCommonValue(validation.validRows.map((row) => row.source));
  const sourceVersion = firstCommonValue(validation.validRows.map((row) => row.sourceVersion));
  const sourceIdentifier = firstCommonValue(validation.validRows.map((row) => row.sourceIdentifier));
  const sourceUrl = firstCommonValue(validation.validRows.map((row) => row.sourceUrl));
  const canConfirm = validation.invalidRowCount === 0 && !duplicateChecksum;

  await db.insert(catalogueReleases).values({
    id,
    domain: input.domain,
    fileName: input.file.name,
    fileChecksum: checksum,
    fileSize: buffer.byteLength,
    mimeType: input.file.type || null,
    fileType: parsed.fileType,
    sourceName,
    sourceIdentifier,
    sourceVersion,
    sourceUrl,
    status: "draft",
    rowCount: validation.rowCount,
    validRowCount: validation.validRowCount,
    invalidRowCount: validation.invalidRowCount,
    newCount: classification.newRows.length,
    updatedCount: classification.updatedRows.length,
    unchangedCount: classification.unchangedRows.length,
    errorCount: validation.errorCount,
    warningCount: validation.warningCount + fileWarnings.length,
    validationResult: {
      errors: validation.errors.slice(0, 500),
      warnings: validation.warnings.slice(0, 500),
      rejectedRows: validation.rejectedRows.slice(0, 500).map((row) => ({
        rowNumber: row.rowNumber,
        reasons: row.reasons,
      })),
      unknownColumns: validation.unknownColumns,
      fileWarnings,
    },
    rows: validation.validRows,
    importedBy: input.actorId,
    createdAt: now,
    updatedAt: now,
  });

  return {
    releaseId: id,
    domain: input.domain,
    fileName: input.file.name,
    checksum,
    fileType: parsed.fileType,
    fileSize: buffer.byteLength,
    rowCount: validation.rowCount,
    validRowCount: validation.validRowCount,
    invalidRowCount: validation.invalidRowCount,
    newCount: classification.newRows.length,
    updatedCount: classification.updatedRows.length,
    unchangedCount: classification.unchangedRows.length,
    errorCount: validation.errorCount,
    warningCount: validation.warningCount + fileWarnings.length,
    errors: validation.errors.slice(0, 100),
    warnings: [...validation.warnings.slice(0, 100), ...fileWarnings.map((message) => ({ row: 0, code: "file", message, severity: "warning" as const }))],
    unknownColumns: validation.unknownColumns,
    fileWarnings,
    canConfirm,
  };
}

export async function loadRelease(id: string) {
  const [release] = await db.select().from(catalogueReleases).where(eq(catalogueReleases.id, id)).limit(1);
  return release ?? null;
}

export async function confirmCatalogueImport(input: {
  releaseId: string;
  actorId: string;
}): Promise<{ success: true; releaseId: string; imported: number; updated: number; unchanged: number }> {
  const release = await loadRelease(input.releaseId);
  if (!release) throw new Error("Import not found");
  if (release.status !== "draft") {
    throw new Error(`Import cannot be confirmed in status ${release.status}`);
  }
  if (release.invalidRowCount > 0) {
    throw new Error("Import contains validation errors and cannot be confirmed.");
  }

  const [duplicate] = await db
    .select({ id: catalogueReleases.id })
    .from(catalogueReleases)
    .where(and(
      eq(catalogueReleases.domain, release.domain),
      eq(catalogueReleases.fileChecksum, release.fileChecksum),
      inArray(catalogueReleases.status, ["validated", "approved", "active"]),
    ))
    .limit(1);
  if (duplicate) throw new Error("This file has already been imported.");

  const rows = (release.rows ?? []) as unknown as import("./validation").ValidatedCatalogueRow[];
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Import contains no valid rows.");
  }

  const existing = await existingResourceMap(release.domain as CatalogueDomain);
  const classification = classifyValidatedRows(rows, existing);

  const now = new Date();
  try {
    await db.transaction(async (tx) => {
      for (const row of rows) {
        const resourceId = crypto.randomUUID();
        await tx.insert(catalogueResources).values(resourceValues(release.id, release.domain as CatalogueDomain, row, resourceId, now));
        await tx.insert(catalogueResourceHistory).values({
          id: crypto.randomUUID(),
          resourceId,
          releaseId: release.id,
          action: "imported",
          actorId: input.actorId,
          before: null,
          after: catalogueRowJson(row),
          reason: `Imported from ${release.fileName}`,
          createdAt: now,
        });
      }

      await tx.update(catalogueReleases)
        .set({
          status: "validated",
          validatedAt: now,
          newCount: classification.newRows.length,
          updatedCount: classification.updatedRows.length,
          unchangedCount: classification.unchangedRows.length,
          updatedAt: now,
        })
        .where(eq(catalogueReleases.id, release.id));
    });
  } catch (error) {
    await db.update(catalogueReleases)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(catalogueReleases.id, release.id))
      .catch(() => undefined);
    throw error;
  }

  return {
    success: true,
    releaseId: release.id,
    imported: classification.newRows.length,
    updated: classification.updatedRows.length,
    unchanged: classification.unchangedRows.length,
  };
}

export async function approveCatalogueRelease(input: { releaseId: string; actorId: string }) {
  const release = await loadRelease(input.releaseId);
  if (!release) throw new Error("Import not found");
  if (release.status !== "validated") throw new Error(`Release cannot be approved in status ${release.status}`);
  const now = new Date();
  await db.update(catalogueReleases)
    .set({ status: "approved", approvedAt: now, approvedBy: input.actorId, updatedAt: now })
    .where(eq(catalogueReleases.id, release.id));
  return { success: true as const };
}

export async function activateCatalogueRelease(input: { releaseId: string; actorId: string }) {
  const release = await loadRelease(input.releaseId);
  if (!release) throw new Error("Import not found");
  if (release.status !== "approved") throw new Error(`Release must be approved before activation (current: ${release.status})`);

  const now = new Date();
  await db.transaction(async (tx) => {
    const previous = await tx
      .select({ id: catalogueReleases.id })
      .from(catalogueReleases)
      .where(and(
        eq(catalogueReleases.domain, release.domain),
        eq(catalogueReleases.status, "active"),
      ));
    if (previous.length > 0) {
      const previousIds = previous.map((row) => row.id);
      await tx.update(catalogueReleases)
        .set({ status: "retired", retiredAt: now, updatedAt: now })
        .where(inArray(catalogueReleases.id, previousIds));
      await tx.update(catalogueResources)
        .set({ lifecycle: "retired", updatedAt: now })
        .where(and(
          inArray(catalogueResources.releaseId, previousIds),
          eq(catalogueResources.lifecycle, "active"),
        ));
    }

    await tx.update(catalogueReleases)
      .set({ status: "active", activatedAt: now, activatedBy: input.actorId, updatedAt: now })
      .where(eq(catalogueReleases.id, release.id));

    const resources = await tx
      .select({ id: catalogueResources.id, isActive: catalogueResources.isActive })
      .from(catalogueResources)
      .where(eq(catalogueResources.releaseId, release.id));
    for (const resource of resources) {
      await tx.update(catalogueResources)
        .set({ lifecycle: resource.isActive ? "active" : "inactive", updatedAt: now })
        .where(eq(catalogueResources.id, resource.id));
      await tx.insert(catalogueResourceHistory).values({
        id: crypto.randomUUID(),
        resourceId: resource.id,
        releaseId: release.id,
        action: resource.isActive ? "activated" : "left_inactive",
        actorId: input.actorId,
        before: null,
        after: { isActive: resource.isActive },
        reason: `Release ${release.id} activated`,
        createdAt: now,
      });
    }
  });

  return { success: true as const };
}

export async function retireCatalogueRelease(input: { releaseId: string; actorId: string; reason?: string }) {
  const release = await loadRelease(input.releaseId);
  if (!release) throw new Error("Import not found");
  if (release.status !== "active") throw new Error("Only an active release can be retired.");
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.update(catalogueReleases)
      .set({ status: "retired", retiredAt: now, updatedAt: now })
      .where(eq(catalogueReleases.id, release.id));
    const resources = await tx
      .select({ id: catalogueResources.id })
      .from(catalogueResources)
      .where(eq(catalogueResources.releaseId, release.id));
    await tx.update(catalogueResources)
      .set({ lifecycle: "retired", updatedAt: now })
      .where(eq(catalogueResources.releaseId, release.id));
    for (const resource of resources) {
      await tx.insert(catalogueResourceHistory).values({
        id: crypto.randomUUID(),
        resourceId: resource.id,
        releaseId: release.id,
        action: "release_retired",
        actorId: input.actorId,
        before: null,
        after: null,
        reason: input.reason ?? "Catalogue release retired",
        createdAt: now,
      });
    }
  });
  return { success: true as const };
}

export async function listCatalogueReleases(domain?: CatalogueDomain, limit = 50) {
  const base = db
    .select({ release: catalogueReleases, importedByName: user.name })
    .from(catalogueReleases)
    .leftJoin(user, eq(catalogueReleases.importedBy, user.id))
    .$dynamic();
  const rows = domain
    ? await base.where(eq(catalogueReleases.domain, domain)).orderBy(desc(catalogueReleases.createdAt)).limit(Math.min(limit, ADMIN_PAGE_LIMIT))
    : await base.orderBy(desc(catalogueReleases.createdAt)).limit(Math.min(limit, ADMIN_PAGE_LIMIT));
  return rows.map(({ release, importedByName }) => ({
    ...release,
    importedByName,
    rows: undefined,
    validationResult: undefined,
  }));
}

export interface AdminResourceFilters {
  domain: CatalogueDomain;
  query?: string;
  status?: "all" | "active" | "inactive";
  releaseId?: string;
  limit?: number;
}

export async function listAdminResources(filters: AdminResourceFilters) {
  const release = filters.releaseId
    ? await loadRelease(filters.releaseId)
    : await getActiveRelease(filters.domain);
  if (!release) return { release: null, resources: [] };

  const conditions = [eq(catalogueResources.releaseId, release.id)];
  if (filters.status === "active") conditions.push(eq(catalogueResources.lifecycle, "active"));
  if (filters.status === "inactive") conditions.push(inArray(catalogueResources.lifecycle, ["inactive", "retired"]));
  if (filters.query?.trim()) {
    const pattern = `%${filters.query.trim().replace(/[%_\\]/g, (match) => `\\${match}`)}%`;
    conditions.push(or(
      ilike(catalogueResources.name, pattern),
      ilike(catalogueResources.code, pattern),
      ilike(catalogueResources.sourceIdentifier, pattern),
    )!);
  }

  const resources = await db
    .select()
    .from(catalogueResources)
    .where(and(...conditions))
    .orderBy(asc(catalogueResources.name))
    .limit(Math.min(filters.limit ?? 50, ADMIN_PAGE_LIMIT));

  return { release: { id: release.id, status: release.status, sourceVersion: release.sourceVersion, fileName: release.fileName }, resources };
}

export async function setCatalogueResourceActive(input: {
  resourceId: string;
  active: boolean;
  actorId: string;
  reason?: string;
}) {
  const [resource] = await db.select().from(catalogueResources).where(eq(catalogueResources.id, input.resourceId)).limit(1);
  if (!resource) throw new Error("Resource not found");
  const release = await loadRelease(resource.releaseId);
  if (!release) throw new Error("Release not found");
  if (release.status !== "active") throw new Error("Only resources in the active release can be changed.");

  const now = new Date();
  const before = { lifecycle: resource.lifecycle, isActive: resource.isActive };
  await db.transaction(async (tx) => {
    await tx.update(catalogueResources)
      .set({ lifecycle: input.active ? "active" : "inactive", isActive: input.active, updatedAt: now })
      .where(eq(catalogueResources.id, resource.id));
    await tx.insert(catalogueResourceHistory).values({
      id: crypto.randomUUID(),
      resourceId: resource.id,
      releaseId: resource.releaseId,
      action: input.active ? "reactivated" : "deactivated",
      actorId: input.actorId,
      before,
      after: { lifecycle: input.active ? "active" : "inactive", isActive: input.active },
      reason: input.reason ?? null,
      createdAt: now,
    });
  });
  return { success: true as const };
}

export async function getCatalogueResourceHistory(resourceId: string) {
  return db
    .select()
    .from(catalogueResourceHistory)
    .where(eq(catalogueResourceHistory.resourceId, resourceId))
    .orderBy(desc(catalogueResourceHistory.createdAt))
    .limit(50);
}

async function existingResourceMap(domain: CatalogueDomain): Promise<Map<string, CatalogueRow>> {
  const release = await getActiveRelease(domain);
  if (!release) return new Map();
  const rows = await db
    .select()
    .from(catalogueResources)
    .where(eq(catalogueResources.releaseId, release.id));
  return new Map(rows.map((row) => [row.stableIdentifier.trim().toLowerCase(), resourceToCatalogueRow(row)]));
}

function resourceToCatalogueRow(row: typeof catalogueResources.$inferSelect): CatalogueRow {
  return {
    resourceId: row.stableIdentifier,
    name: row.name,
    code: row.code,
    codingSystem: row.codingSystem,
    codingSystemVersion: row.codingSystemVersion,
    description: row.description,
    synonyms: row.synonyms,
    category: row.category,
    specimen: row.specimen,
    modality: row.modality,
    genericName: row.genericName,
    brandName: row.brandName,
    activeIngredient: row.activeIngredient,
    strength: row.strength,
    dosageForm: row.dosageForm,
    route: row.route,
    source: row.source,
    sourceIdentifier: row.sourceIdentifier,
    sourceVersion: row.sourceVersion,
    sourceUrl: row.sourceUrl,
    provenanceNotes: row.provenanceNotes,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    isActive: row.isActive,
    notes: row.notes,
  };
}

function resourceValues(
  releaseId: string,
  domain: CatalogueDomain,
  row: import("./validation").ValidatedCatalogueRow,
  id: string,
  now: Date,
) {
  return {
    id,
    releaseId,
    domain,
    stableIdentifier: row.resourceId,
    code: row.code,
    name: row.name,
    description: row.description,
    codingSystem: row.codingSystem,
    codingSystemVersion: row.codingSystemVersion,
    synonyms: row.synonyms,
    category: row.category,
    specimen: row.specimen,
    modality: row.modality,
    genericName: row.genericName,
    brandName: row.brandName,
    activeIngredient: row.activeIngredient,
    strength: row.strength,
    dosageForm: row.dosageForm,
    route: row.route,
    source: row.source,
    sourceIdentifier: row.sourceIdentifier,
    sourceVersion: row.sourceVersion,
    sourceUrl: row.sourceUrl,
    provenanceNotes: row.provenanceNotes,
    lifecycle: "validated",
    isActive: row.isActive,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    metadata: row.raw,
    createdAt: now,
    updatedAt: now,
  };
}

function catalogueRowJson(row: CatalogueRow) {
  return JSON.parse(JSON.stringify(row));
}

function firstCommonValue(values: (string | null)[]): string | null {
  const filtered = values.filter((value): value is string => Boolean(value && value.trim()));
  if (filtered.length === 0) return null;
  const first = filtered[0];
  return filtered.every((value) => value === first) ? first : null;
}

export async function getConsultationClinicalSelections(consultationId: string) {
  const diagnoses = await db
    .select()
    .from(consultationDiagnoses)
    .where(eq(consultationDiagnoses.consultationId, consultationId))
    .orderBy(asc(consultationDiagnoses.sortOrder), asc(consultationDiagnoses.createdAt));
  const requests = await db
    .select()
    .from(consultationRequests)
    .where(eq(consultationRequests.consultationId, consultationId))
    .orderBy(asc(consultationRequests.sortOrder), asc(consultationRequests.createdAt));
  return { diagnoses, requests };
}

export async function getImportActorName(userId: string): Promise<string | null> {
  const [row] = await db.select({ name: user.name }).from(user).where(eq(user.id, userId)).limit(1);
  return row?.name ?? null;
}

export type { ImportClassification, ValidationSummary, DocumentType, ReleaseStatus };
