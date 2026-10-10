import {
  i18n,
  isPublicLocale as isConfiguredPublicLocale,
  publicLocaleFor,
  strapiLocaleFor,
  type Locale,
  type StrapiLocale,
} from "@/i18n.config";

/**
 * Returns true when the given value is one of the configured locales.
 * Used to stop static assets (e.g. /icon.svg, /favicon.ico, /images/*,
 * /uploads/*) that slip past the middleware from being rendered as locale
 * routes and from triggering CMS fetches with a bogus locale.
 */
export const isValidLocale = isConfiguredPublicLocale;

export function toStrapiLocale(locale: string): StrapiLocale | null {
  return isConfiguredPublicLocale(locale)
    ? strapiLocaleFor(locale)
    : null;
}

export function toPublicLocale(locale: string): Locale | null {
  return publicLocaleFor(locale);
}
