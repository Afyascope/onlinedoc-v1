/**
 * Public URL prefixes are intentionally separate from Strapi locale codes.
 * `/sw` is the stable public URL while Strapi stores Kenyan Swahili as `sw-KE`.
 */
export const i18n = {
  defaultLocale: "en",
  locales: ["en", "sw"],
  strapiLocales: {
    en: "en",
    sw: "sw-KE",
  },
} as const;

export type Locale = (typeof i18n)["locales"][number];
export type StrapiLocale = (typeof i18n.strapiLocales)[Locale];

export function isPublicLocale(value: string): value is Locale {
  return (i18n.locales as readonly string[]).includes(value);
}

export function strapiLocaleFor(locale: Locale): StrapiLocale {
  return i18n.strapiLocales[locale];
}

export function publicLocaleFor(value: string): Locale | null {
  const entry = (Object.entries(i18n.strapiLocales) as [Locale, StrapiLocale][])
    .find(([, strapiLocale]) => strapiLocale === value);

  return entry?.[0] ?? (isPublicLocale(value) ? value : null);
}
