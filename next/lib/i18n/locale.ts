import { i18n } from "@/i18n.config";

/**
 * Returns true when the given value is one of the configured locales.
 * Used to stop static assets (e.g. /icon.svg, /favicon.ico, /images/*,
 * /uploads/*) that slip past the middleware from being rendered as locale
 * routes and from triggering CMS fetches with a bogus locale.
 */
export function isValidLocale(locale: string): boolean {
  return (i18n.locales as readonly string[]).includes(locale);
}
