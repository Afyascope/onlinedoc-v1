import { i18n, isPublicLocale, publicLocaleFor, type Locale } from "@/i18n.config";
import { siteUrl } from "@/lib/config";

/**
 * OpenGraph `locale` values must be language_TERRITORY codes. The public URL
 * prefixes (`en`, `sw`) are intentionally not valid OG locales on their own.
 */
export const OPEN_GRAPH_LOCALE: Record<Locale, string> = {
  en: "en_US",
  sw: "sw_KE",
};

export type Alternates = {
  canonical: string;
  languages: Record<string, string>;
};

export function openGraphLocale(locale: string): string {
  return isPublicLocale(locale) ? OPEN_GRAPH_LOCALE[locale] : locale;
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${normalized}`;
}

/**
 * Alternates for route-level pages that genuinely exist in every configured
 * public locale (home, blog index, health index/section, ...). `x-default`
 * points at the default locale, which always exists for these routes.
 */
export function routeAlternates(pathFor: (locale: Locale) => string, self: string): Alternates {
  const languages: Record<string, string> = {};
  for (const locale of i18n.locales) {
    languages[locale] = absoluteUrl(pathFor(locale));
  }
  languages["x-default"] = absoluteUrl(pathFor(i18n.defaultLocale));

  const selfLocale = isPublicLocale(self) ? self : i18n.defaultLocale;
  return {
    canonical: absoluteUrl(pathFor(selfLocale)),
    languages,
  };
}

/**
 * Alternates for localized detail pages. Every alternate URL is derived from an
 * actual localization record with a real slug, converted from the Strapi locale
 * code to the public prefix. No alternate is synthesized from another locale's
 * slug, and `x-default` is only emitted when the default-locale destination
 * actually exists.
 */
export function detailAlternates(
  localizations: Array<{ locale?: string; slug?: string }> | null | undefined,
  options: {
    locale: string;
    slug: string;
    buildPath: (locale: Locale, slug: string) => string;
  },
): Alternates {
  const { slug, buildPath } = options;
  const selfLocale = isPublicLocale(options.locale) ? options.locale : i18n.defaultLocale;
  const languages: Record<string, string> = {};
  const seen = new Set<Locale>();

  const add = (target: Locale, targetSlug: string) => {
    if (!targetSlug || seen.has(target)) return;
    seen.add(target);
    languages[target] = absoluteUrl(buildPath(target, targetSlug));
  };

  add(selfLocale, slug);
  for (const localization of localizations ?? []) {
    if (!localization?.locale || !localization?.slug) continue;
    const publicLocale = publicLocaleFor(localization.locale);
    if (publicLocale) add(publicLocale, localization.slug);
  }

  if (languages[i18n.defaultLocale]) {
    languages["x-default"] = languages[i18n.defaultLocale];
  }

  return {
    canonical: absoluteUrl(buildPath(selfLocale, slug)),
    languages,
  };
}
