import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getClinicianStatus } from "@/lib/clinician-status";
import { canSearchClinicianCatalogue } from "@/lib/catalogue/authorization";
import { isCatalogueDomain } from "@/lib/catalogue/domains";
import { isSearchableCatalogueSearchQuery, normalizeCatalogueSearchQuery } from "@/lib/catalogue/search-query";
import { searchActiveCatalogue } from "@/lib/catalogue/service";
import { sanitizeDatabaseError } from "@/lib/db/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canSearchClinicianCatalogue(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.user.role === "clinician" && getClinicianStatus(session.user) !== "APPROVED") {
    return NextResponse.json({ error: "Clinician approval required" }, { status: 403 });
  }

  const url = new URL(request.url);
  const domain = url.searchParams.get("domain") ?? "";
  const query = normalizeCatalogueSearchQuery(url.searchParams.get("q"));
  if (!isCatalogueDomain(domain)) {
    return NextResponse.json({ error: "Unsupported catalogue domain" }, { status: 400 });
  }
  if (!isSearchableCatalogueSearchQuery(query)) return NextResponse.json({ results: [] });

  try {
    const results = await searchActiveCatalogue(domain, query);
    return NextResponse.json({ results });
  } catch (error) {
    const safeError = sanitizeDatabaseError(error);
    console.error(JSON.stringify({ event: "catalogue.search.failed", domain, error: safeError, timestamp: new Date().toISOString() }));
    return NextResponse.json(
      { error: "Catalogue search is temporarily unavailable.", code: safeError.code },
      { status: 503 },
    );
  }
}
