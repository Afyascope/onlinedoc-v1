import { getCatalogueAdminOverview, getCatalogueImportHistory } from "@/lib/actions/catalogue-admin";
import { CatalogueAdminClient } from "./client";

export const dynamic = "force-dynamic";

export default async function CatalogueAdminPage() {
  const [overview, releases] = await Promise.all([
    getCatalogueAdminOverview(),
    getCatalogueImportHistory(),
  ]);
  return <CatalogueAdminClient initialOverview={overview} initialReleases={releases} />;
}
