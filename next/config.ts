export {
  i18n,
  isPublicLocale,
  publicLocaleFor,
  strapiLocaleFor,
} from "./i18n.config";
export type { Locale, StrapiLocale } from "./i18n.config";

import { i18n } from "./i18n.config";

export const defaultLocale = i18n.defaultLocale;
export const locales = i18n.locales;

export const pathnames = {};
export const localePrefix = "always";

export const port = process.env.PORT || 3000;
export const host = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.NODE_ENV === "production"
    ? undefined
    : `http://localhost:${port}`;
