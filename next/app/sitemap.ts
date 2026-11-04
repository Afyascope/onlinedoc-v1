import { MetadataRoute } from "next";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { i18n } from "@/i18n.config";
import { siteUrl } from "@/lib/config";
import { healthSections, type HealthSection } from "@/lib/health/content";
import { detailAlternates, localizedLocales, routeAlternates } from "@/lib/seo/alternates";

// CMS-backed URLs change after deployment. Regenerate hourly so new articles,
// products, and health entries reach the sitemap without a rebuild.
export const revalidate = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isNoindex(item: Record<string, any>): boolean {
  return /(?:^|[,\s])noindex(?:$|[,\s])/i.test(item?.seo?.metaRobots ?? "");
}

function isPlaceholder(item: Record<string, any>): boolean {
  const text = `${item?.slug ?? ""} ${item?.name ?? item?.title ?? ""}`;
  return /(?:^|[\s_-])(?:test|placeholder)(?:$|[\s_-])/i.test(text);
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
      populate: {
        localizations: { fields: ["slug", "locale"] },
        seo: { fields: ["metaRobots"] },
      },
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
    lastModified?: Date,
  ) => {
    if (entries.has(url)) return;
    const entry: SitemapEntry = { url, changeFrequency, priority };
    // Only emit lastmod when a real content date exists. A fresh `new Date()`
    // on every request falsely signals that static pages changed constantly.
    if (lastModified) entry.lastModified = lastModified;
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
  addRoute(locale => `/${locale}/blog`, 0.8, "weekly");
  addRoute(locale => `/${locale}/products`, 0.8, "weekly");
  addRoute(locale => `/${locale}/health`, 0.8, "weekly");
  // Legal pages are English-only and canonicalized to /en, so they are listed
  // once with no hreflang alternates.
  addEntry(`${baseUrl}/en/privacy-policy`, {}, 0.4, "yearly");
  addEntry(`${baseUrl}/en/terms-of-service`, {}, 0.4, "yearly");
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
      if (!slug || isNoindex(item) || isPlaceholder(item)) continue;
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
    const homepage = pages.find(page => page?.slug === "homepage");
    const homepageLocales = localizedLocales(homepage?.localizations, locale);
    const homepageAlternates = routeAlternates(
      targetLocale => `/${targetLocale}`,
      locale,
      homepageLocales,
    );
    addEntry(
      `${baseUrl}/${locale}`,
      homepageAlternates.languages,
      1.0,
      "weekly",
      toDate(homepage?.updatedAt),
    );
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
    const products = await fetchContentType("products", {
      fields: "slug,name,updatedAt",
    });
    const list = products?.data;
    const productList = Array.isArray(list) ? list : list ? [list] : [];
    for (const product of productList) {
      const slug = product?.slug;
      if (!slug || isPlaceholder(product)) continue;
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
