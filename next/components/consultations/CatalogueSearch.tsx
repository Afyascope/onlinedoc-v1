"use client";

import { useEffect, useId, useState } from "react";
import { IconSearch, IconLoader2, IconRefresh } from "@tabler/icons-react";
import { createCatalogueSearchClient } from "@/lib/catalogue/search-client";
import { normalizeCatalogueSearchQuery } from "@/lib/catalogue/search-query";
import type { CatalogueDomain } from "@/lib/catalogue/domains";

export interface CatalogueOption {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  specimen: string | null;
  modality: string | null;
  strength: string | null;
  dosageForm: string | null;
  route: string | null;
  genericName: string | null;
  brandName: string | null;
  activeIngredient?: string | null;
  source: string | null;
  sourceVersion: string | null;
}

async function fetchCatalogueOptions(
  domain: CatalogueDomain,
  query: string,
  signal: AbortSignal,
): Promise<CatalogueOption[]> {
  const response = await fetch(
    `/api/catalogue/search?domain=${encodeURIComponent(domain)}&q=${encodeURIComponent(query)}`,
    {
      signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    },
  );

  if (!response.ok) {
    let message = "Catalogue search is unavailable.";
    try {
      const body = await response.json();
      if (typeof body?.error === "string" && body.error) message = body.error;
    } catch {
      // Keep the safe generic message when the response is not JSON.
    }
    throw new Error(message);
  }

  const body = await response.json();
  return Array.isArray(body?.results) ? (body.results as CatalogueOption[]) : [];
}

export function CatalogueSearch({
  domain,
  placeholder,
  label,
  onSelect,
  disabled = false,
}: {
  domain: CatalogueDomain;
  placeholder: string;
  label?: string;
  onSelect: (option: CatalogueOption) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogueOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [retryToken, setRetryToken] = useState(0);
  const listboxId = useId();

  const trimmedQuery = normalizeCatalogueSearchQuery(query);

  useEffect(() => {
    const client = createCatalogueSearchClient<CatalogueOption>((nextQuery, signal) =>
      fetchCatalogueOptions(domain, nextQuery, signal),
    );

    void client.search(query, {
      onIdle: () => {
        setResults([]);
        setError(null);
        setLoading(false);
        setOpen(false);
        setActiveIndex(-1);
      },
      onLoading: () => {
        setResults([]);
        setError(null);
        setLoading(true);
        setOpen(true);
        setActiveIndex(-1);
      },
      onResults: (found) => {
        setResults(found);
        setError(null);
        setLoading(false);
        setOpen(true);
        setActiveIndex(found.length > 0 ? 0 : -1);
      },
      onError: () => {
        setResults([]);
        setError("Unable to search the catalogue. Check your connection and try again.");
        setLoading(false);
        setOpen(true);
        setActiveIndex(-1);
      },
    });

    return () => client.cancel();
  }, [query, domain, retryToken]);

  const selectOption = (option: CatalogueOption) => {
    onSelect(option);
    setQuery("");
    setResults([]);
    setError(null);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (results.length > 0) {
        setActiveIndex((current) => (current + 1) % results.length);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (results.length > 0) {
        setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
      }
      return;
    }

    if (event.key === "Enter") {
      if (open && activeIndex >= 0 && results[activeIndex]) {
        event.preventDefault();
        selectOption(results[activeIndex]);
      }
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const subtitle = (option: CatalogueOption) => {
    return [
      option.code ? `Code ${option.code}` : "",
      option.category,
      option.specimen,
      option.modality,
      option.strength,
      option.dosageForm,
      option.genericName,
      option.brandName,
      option.activeIngredient,
    ].filter(Boolean).join(" · ");
  };

  const showDropdown = open && Boolean(trimmedQuery);

  return (
    <div className="relative">
      <div className="relative">
        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={query}
          disabled={disabled}
          role="combobox"
          aria-label={label ?? placeholder}
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={
            showDropdown && activeIndex >= 0 && results[activeIndex]
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 || loading || error) setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50"
          autoComplete="off"
        />
        {loading && <IconLoader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand animate-spin" />}
      </div>

      {showDropdown && (
        <div
          id={listboxId}
          className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border border-border bg-white shadow-lg"
        >
          {error ? (
            <div role="alert" className="px-3 py-2.5 text-xs text-red-600">
              <p>{error}</p>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setRetryToken((value) => value + 1)}
                className="mt-2 inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 font-medium hover:bg-red-50"
              >
                <IconRefresh size={13} /> Try again
              </button>
            </div>
          ) : loading ? (
            <p role="status" className="px-3 py-3 text-xs text-neutral-500">Searching…</p>
          ) : results.length === 0 ? (
            <p role="status" className="px-3 py-3 text-xs text-neutral-500">No matching catalogue items.</p>
          ) : (
            <div role="listbox" aria-label={label ?? placeholder}>
              {results.map((option, index) => (
                <button
                  key={option.id}
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                  className={`w-full text-left px-3 py-2.5 border-b border-border last:border-0 transition-colors ${
                    index === activeIndex ? "bg-brand/10" : "hover:bg-brand/5"
                  }`}
                >
                  <p className="text-sm font-medium text-primary">{option.name}</p>
                  {subtitle(option) && <p className="text-xs text-neutral-500 mt-0.5">{subtitle(option)}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
