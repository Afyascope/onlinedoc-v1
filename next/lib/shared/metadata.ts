import { strapiImage } from '../strapi/strapiImage';
import { isPublicLocale } from '@/i18n.config';
import { OPEN_GRAPH_LOCALE, type Alternates } from '../seo/alternates';

const siteName = "OnlineDoc Healthcare";
const defaultDescription =
  "Consult licensed clinicians online, explore a clinician-informed health library, and access digital health products with OnlineDoc Healthcare.";

/** Shared fallback so every public page has a valid social preview image. */
const defaultOpenGraphImages = [
  {
    url: "/og-default.png",
    width: 1200,
    height: 630,
    alt: `${siteName} — online consultations, health library, and digital health products`,
  },
];

export function generateMetadataObject(
  seo: any,
  options?: {
    locale?: string;
    type?: string;
    canonical?: string;
    alternates?: Alternates;
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
    fallbackTitle?: string;
    fallbackDescription?: string;
  }
) {
  const locale = options?.locale || "en";
  const type = options?.type || "website";
  const canonical = options?.canonical;
  const alternates = options?.alternates ?? (canonical ? { canonical } : undefined);
  const openGraphLocale = isPublicLocale(locale) ? OPEN_GRAPH_LOCALE[locale] : locale;
  const title = seo?.metaTitle || options?.fallbackTitle || undefined;
  // CMS titles sometimes already include the brand. Use an absolute title so
  // the root template does not append "| OnlineDoc Healthcare" a second time.
  const titleValue = title && /OnlineDoc/i.test(title) ? { absolute: title } : title;
  const description = seo?.metaDescription || seo?.ogDescription || options?.fallbackDescription || defaultDescription;

  const images = seo?.metaImage
    ? [{
        url: strapiImage(seo.metaImage.url),
        width: seo.metaImage.width || 1200,
        height: seo.metaImage.height || 630,
        alt: seo.metaImage.alternativeText || seo?.metaTitle || "",
      }]
    : defaultOpenGraphImages;

  const twitterImages = seo?.twitterImage
    ? [{ url: seo.twitterImage }]
    : seo?.metaImage
    ? [{ url: strapiImage(seo.metaImage.url) }]
    : [{ url: "/og-default.png" }];

  return {
    ...(titleValue ? { title: titleValue } : {}),
    description,
    openGraph: {
      title: seo?.ogTitle || title || undefined,
      description,
      locale: openGraphLocale,
      type,
      siteName,
      ...(alternates?.canonical ? { url: alternates.canonical } : {}),
      ...(type === "article" && options?.publishedTime
        ? { publishedTime: options.publishedTime }
        : {}),
      ...(type === "article" && options?.modifiedTime
        ? { modifiedTime: options.modifiedTime }
        : {}),
      ...(type === "article" && options?.authors?.length
        ? { authors: options.authors }
        : {}),
      images,
    },
    twitter: {
      card: seo?.twitterCard || 'summary_large_image',
      title: seo?.twitterTitle || title || undefined,
      description: seo?.twitterDescription || description,
      images: twitterImages,
    },
    ...(alternates ? { alternates } : {}),
  }
}
