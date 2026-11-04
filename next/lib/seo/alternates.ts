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
  const pathOnly = path.split(/[?#]/, 1)[0] || "/";
  const normalized = `/${pathOnly}`.replace(/\/{2,}/g, "/");
  return `${siteUrl()}${normalized}`;
}

/**
 * Public locales backed by a real CMS localization record, plus the current
 * locale when the requested page genuinely exists. Never assumes that a route
 * prefix alone means a translated page exists.
 */
export function localizedLocales(
  localizations: Array<{ locale?: string }> | null | undefined,
  self: string,
  options?: { selfExists?: boolean },
): Locale[] {
  const available = new Set<Locale>();

  if (options?.selfExists !== false && isPublicLocale(self)) {
    available.add(self);
  }

  for (const localization of localizations ?? []) {
    if (!localization?.locale) continue;
    const publicLocale = publicLocaleFor(localization.locale);
    if (publicLocale) available.add(publicLocale);
  }

  return i18n.locales.filter(locale => available.has(locale));
}

/**
 * Alternates for route-level pages. Only pass locales that genuinely have a
 * published page; the caller derives them from CMS localizations. If the
 * current locale is unavailable, the canonical points at the default locale.
 */
export function routeAlternates(
  pathFor: (locale: Locale) => string,
  self: string,
  availableLocales: readonly Locale[] = i18n.locales,
): Alternates {
  const locales = availableLocales.length > 0 ? availableLocales : [i18n.defaultLocale];
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = absoluteUrl(pathFor(locale));
  }

  const selfLocale = isPublicLocale(self) ? self : i18n.defaultLocale;
  const canonicalLocale = locales.includes(selfLocale)
    ? selfLocale
    : locales.includes(i18n.defaultLocale)
      ? i18n.defaultLocale
      : locales[0];

  if (languages[i18n.defaultLocale]) {
    languages["x-default"] = languages[i18n.defaultLocale];
  }

  return {
    canonical: absoluteUrl(pathFor(canonicalLocale)),
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
