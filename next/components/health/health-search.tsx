"use client";

import { useMemo, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import { HealthCard } from "@/components/health/health-card";
import { contentDescription, contentTitle, healthLabel, type HealthItem, type HealthSection } from "@/lib/health/content";

export function HealthSearch({ items, section, locale }: { items: HealthItem[]; section: HealthSection; locale: string }) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    if (!normalized) return items;
    return items.filter(item => `${contentTitle(section, item)} ${contentDescription(section, item) || ""}`.toLocaleLowerCase(locale).includes(normalized));
  }, [items, locale, query, section]);
  return <>
    <div className="relative mb-8 max-w-md">
      <label className="sr-only" htmlFor="health-search">{healthLabel(locale, "search")}</label>
      <input id="health-search" value={query} onChange={event => setQuery(event.target.value)} placeholder={`${healthLabel(locale, "search")} ${healthLabel(locale, "library")}`} className="w-full rounded-xl border border-border bg-white py-3 pl-4 pr-11 text-sm text-primary placeholder-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" />
      <IconSearch className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
    </div>
    {shown.length ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{shown.map(item => <HealthCard key={item.id} item={item} section={section} locale={locale} />)}</div> : <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-14 text-center text-neutral-600">{healthLabel(locale, "empty")}</div>}
  </>;
}
