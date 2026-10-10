import { isPublicLocale, strapiLocaleFor } from "@/i18n.config";

/**
 * A populated relation is safe to link only when it has a slug and belongs
 * to the requested Strapi locale. English keeps the existing behavior for
 * responses that do not expose locale metadata.
 */
export function isRelatedContentForLocale<T extends { slug?: string; locale?: string }>(
  item: T | null | undefined,
  locale: string
): item is T {
  if (!item?.slug || !isPublicLocale(locale)) return false;

  const itemLocale = item.locale;
  return locale === "en"
    ? itemLocale === undefined || itemLocale === strapiLocaleFor(locale)
    : itemLocale === strapiLocaleFor(locale);
}
