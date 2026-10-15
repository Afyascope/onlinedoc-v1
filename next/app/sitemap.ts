import { MetadataRoute } from "next";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { i18n } from "@/i18n.config";
import { siteUrl } from "@/lib/config";
import { healthSections, type HealthSection } from "@/lib/health/content";
import { detailAlternates, routeAlternates } from "@/lib/seo/alternates";

type SitemapEntry = MetadataRoute.Sitemap[number];

function toDate(value: unknown): Date {
  const date = value ? new Date(value as string) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

async function fetchLocaleCollection(
  contentType: string,
  locale: string,
  collectionLabel: string,
): Promise<Array<Record<string, any>>> {
  try {
    const response = await fetchContentType(contentType, {
      filters: { locale },
      fields: "slug,updatedAt",
      // Explicit populate disables the global deepPopulate middleware so the
      // sitemap only pulls the localized slugs it needs for alternates.
      populate: { localizations: { fields: ["slug", "locale"] } },
    });
    const list = response?.data;
    return Array.isArray(list) ? list : list ? [list] : [];
  } catch (error) {
    console.warn(
      `sitemap: failed to fetch ${collectionLabel} for locale "${locale}":`,
      error instanceof Error ? error.message : "unknown error",
    );
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const entries = new Map<string, SitemapEntry>();

  const addEntry = (
    url: string,
    languages: Record<string, string>,
    priority: number,
    changeFrequency: SitemapEntry["changeFrequency"],
    lastModified: Date = new Date(),
  ) => {
    if (entries.has(url)) return;
    const entry: SitemapEntry = { url, lastModified, changeFrequency, priority };
    if (Object.keys(languages).length > 0) entry.alternates = { languages };
    entries.set(url, entry);
  };

  const addRoute = (
    pathFor: (locale: (typeof i18n.locales)[number]) => string,
    priority: number,
    changeFrequency: SitemapEntry["changeFrequency"],
  ) => {
    for (const locale of i18n.locales) {
      const { languages } = routeAlternates(pathFor, locale);
      addEntry(`${baseUrl}${pathFor(locale)}`, languages!, priority, changeFrequency);
    }
  };

  // Static, always-present routes that exist in both locales.
  addRoute(locale => `/${locale}`, 1.0, "weekly");
  addRoute(locale => `/${locale}/blog`, 0.8, "weekly");
  addRoute(locale => `/${locale}/products`, 0.8, "weekly");
  addRoute(locale => `/${locale}/health`, 0.8, "weekly");
  // The "articles" section is the same corpus as /blog (canonicalized there),
  // so it is excluded from the sitemap to avoid duplicate/competing URLs.
  const sitemapHealthSections = (
    Object.entries(healthSections) as Array<[HealthSection, (typeof healthSections)[HealthSection]]>
  ).filter(([section]) => section !== "articles");
  for (const [, definition] of sitemapHealthSections) {
    addRoute(locale => `/${locale}/health/${definition.route}`, 0.7, "weekly");
  }

  // Localized CMS pages, with reciprocal alternates derived from real
  // localization records (published-only via the status filter).
  const addDetailEntries = (
    items: Array<Record<string, any>>,
    locale: string,
    buildPath: (locale: string, slug: string) => string,
    priority: number,
  ) => {
    for (const item of items) {
      const slug = item?.slug;
      if (!slug) continue;
      const { languages } = detailAlternates(item?.localizations, {
        locale,
        slug,
        buildPath,
      });
      for (const [key, url] of Object.entries(languages!)) {
        if (key === "x-default") continue;
        addEntry(url, languages!, priority, "monthly", toDate(item?.updatedAt));
      }
    }
  };

  for (const locale of i18n.locales) {
    const pages = await fetchLocaleCollection("pages", locale, "pages");
    // "homepage" is served at /{locale} (the catch-all redirects it), so it is
    // not a distinct URL and must not appear in the sitemap.
    addDetailEntries(pages.filter(page => page?.slug && page.slug !== "homepage"), locale, (l, slug) => `/${l}/${slug}`, 0.7);

    const articles = await fetchLocaleCollection("articles", locale, "articles");
    addDetailEntries(articles, locale, (l, slug) => `/${l}/blog/${slug}`, 0.6);

    for (const [section, definition] of sitemapHealthSections) {
      const items = await fetchLocaleCollection(definition.api, locale, `health/${section}`);
      addDetailEntries(items, locale, (l, slug) => `/${l}/health/${definition.route}/${slug}`, 0.6);
    }
  }

  // Products are not localized: single canonical entry under the default locale.
  try {
    const products = await fetchContentType("products", { fields: "slug,updatedAt" });
    const list = products?.data;
    const productList = Array.isArray(list) ? list : list ? [list] : [];
    for (const product of productList) {
      const slug = product?.slug;
      if (!slug) continue;
      addEntry(
        `${baseUrl}/${i18n.defaultLocale}/products/${slug}`,
        {},
        0.6,
        "monthly",
        toDate(product?.updatedAt),
      );
    }
  } catch (error) {
    console.warn(
      `sitemap: failed to fetch products:`,
      error instanceof Error ? error.message : "unknown error",
    );
  }

  return Array.from(entries.values());
}
