"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getClinicianStatus } from "@/lib/clinician-status";
import { canSearchClinicianCatalogue } from "@/lib/catalogue/authorization";
import { isCatalogueDomain, type CatalogueDomain } from "@/lib/catalogue/domains";
import { isSearchableCatalogueSearchQuery, normalizeCatalogueSearchQuery } from "@/lib/catalogue/search-query";
import { searchActiveCatalogue, type CatalogueSearchResult } from "@/lib/catalogue/service";
import { sanitizeDatabaseError } from "@/lib/db/errors";

export async function searchCatalogueAction(
  domain: CatalogueDomain,
  query: string,
): Promise<CatalogueSearchResult[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (!canSearchClinicianCatalogue(session.user.role)) throw new Error("Forbidden");
  if (session.user.role === "clinician" && getClinicianStatus(session.user) !== "APPROVED") {
    throw new Error("Clinician approval required");
  }
  if (!isCatalogueDomain(domain)) throw new Error("Unsupported catalogue domain");
  const trimmed = normalizeCatalogueSearchQuery(query);
  if (!isSearchableCatalogueSearchQuery(trimmed)) return [];
  try {
    return await searchActiveCatalogue(domain, trimmed);
  } catch (error) {
    const safeError = sanitizeDatabaseError(error);
    console.error(JSON.stringify({ event: "catalogue.action.search.failed", domain, error: safeError, timestamp: new Date().toISOString() }));
    throw new Error("Catalogue search is temporarily unavailable.");
  }
}
