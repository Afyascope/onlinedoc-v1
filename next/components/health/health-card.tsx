import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { ArticleMedia } from "@/components/blog/article-media";
import { contentDescription, contentTitle, type HealthItem, type HealthSection, healthLabel } from "@/lib/health/content";

export function HealthCard({ item, section, locale }: { item: HealthItem; section: HealthSection; locale: string }) {
  const title = contentTitle(section, item);
  return (
    <Link href={`/${locale}/health/${section}/${item.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white transition hover:border-brand/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
      {item.image && <ArticleMedia media={item.image} alt={item.image.alternativeText || title} className="aspect-[16/9]" sizes="(max-width: 768px) 100vw, 33vw" />}
      <div className="flex flex-1 flex-col p-5">
        {item.categories?.length ? <p className="text-xs font-semibold uppercase tracking-wide text-brand">{item.categories.map(x => x.name).join(" · ")}</p> : null}
        <h2 className="mt-2 font-primary text-xl font-semibold leading-snug text-primary group-hover:text-brand">{title}</h2>
        {contentDescription(section, item) && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-600">{contentDescription(section, item)}</p>}
        <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-brand">{healthLabel(locale, "read")} <IconArrowRight size={16} aria-hidden="true" /></span>
      </div>
    </Link>
  );
}
