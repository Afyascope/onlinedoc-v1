import {
  isSearchableCatalogueSearchQuery,
  normalizeCatalogueSearchQuery,
} from "./search-query";

export interface CatalogueSearchCallbacks<T> {
  onLoading?: () => void;
  onResults: (results: T[], query: string) => void;
  onError: (error: unknown, query: string) => void;
  onIdle?: () => void;
}

export type CatalogueSearchFetcher<T> = (
  query: string,
  signal: AbortSignal,
) => Promise<T[]>;

export function isAbortError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "name" in error &&
      (error as { name?: unknown }).name === "AbortError",
  );
}

/**
 * Sequence catalogue requests so an older response can never overwrite a newer
 * query. Every new search cancels the previous request through AbortController.
 */
export function createCatalogueSearchClient<T>(fetcher: CatalogueSearchFetcher<T>) {
  let controller: AbortController | null = null;
  let sequence = 0;

  function cancel() {
    sequence += 1;
    controller?.abort();
    controller = null;
  }

  async function search(
    rawQuery: string,
    callbacks: CatalogueSearchCallbacks<T>,
  ): Promise<void> {
    const query = normalizeCatalogueSearchQuery(rawQuery);
    cancel();

    if (!query || !isSearchableCatalogueSearchQuery(query)) {
      callbacks.onIdle?.();
      return;
    }

    const requestSequence = sequence;
    const activeController = new AbortController();
    controller = activeController;
    callbacks.onLoading?.();

    try {
      const results = await fetcher(query, activeController.signal);
      if (requestSequence !== sequence || activeController.signal.aborted) return;
      callbacks.onResults(results, query);
    } catch (error) {
      if (
        requestSequence !== sequence ||
        activeController.signal.aborted ||
        isAbortError(error)
      ) {
        return;
      }
      callbacks.onError(error, query);
    } finally {
      if (requestSequence === sequence && controller === activeController) {
        controller = null;
      }
    }
  }

  return { search, cancel };
}
