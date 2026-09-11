export const defaultLocale = "en" as const;
export const locales = ["en", "fr"] as const;

export type Locale = (typeof locales)[number];

export const pathnames = {};
export const localePrefix = "always";

export const port = process.env.PORT || 3000;
export const host = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.NODE_ENV === "production"
    ? undefined
    : `http://localhost:${port}`;
