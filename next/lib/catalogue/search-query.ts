export const CATALOGUE_SEARCH_LIMIT = 20;

export function normalizeCatalogueSearchQuery(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/**
 * A single meaningful character is enough to search. Whitespace-only input is
 * never sent to the database.
 */
export function isSearchableCatalogueSearchQuery(value: string | null | undefined): boolean {
  return normalizeCatalogueSearchQuery(value).length > 0;
}

export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export function catalogueSearchPatterns(value: string) {
  const normalized = normalizeCatalogueSearchQuery(value);
  if (!normalized) return null;

  const escaped = escapeLikePattern(normalized);
  return {
    value: normalized,
    prefix: `${escaped}%`,
    contains: `%${escaped}%`,
  };
}
