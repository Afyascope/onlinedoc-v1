import { strapiImage } from '../strapi/strapiImage';
import { isPublicLocale } from '@/i18n.config';
import { OPEN_GRAPH_LOCALE, type Alternates } from '../seo/alternates';

const siteName = "OnlineDoc Healthcare";
const twitterSite = "@onlinedoc";

export function generateMetadataObject(
  seo: any,
  options?: { locale?: string; type?: string; canonical?: string; alternates?: Alternates }
) {
  const locale = options?.locale || "en";
  const type = options?.type || "website";
  const canonical = options?.canonical;
  const alternates = options?.alternates ?? (canonical ? { canonical } : undefined);
  const openGraphLocale = isPublicLocale(locale) ? OPEN_GRAPH_LOCALE[locale] : locale;

  const images = seo?.metaImage
    ? [{
        url: strapiImage(seo.metaImage.url),
        width: seo.metaImage.width || 1200,
        height: seo.metaImage.height || 630,
        alt: seo.metaImage.alternativeText || seo?.metaTitle || "",
      }]
    : [];

  const twitterImages = seo?.twitterImage
    ? [{ url: seo.twitterImage }]
    : seo?.metaImage
    ? [{ url: strapiImage(seo.metaImage.url) }]
    : [];

  return {
    title: seo?.metaTitle || undefined,
    description: seo?.metaDescription || undefined,
    openGraph: {
      title: seo?.ogTitle || seo?.metaTitle || undefined,
      description: seo?.ogDescription || seo?.metaDescription || undefined,
      locale: openGraphLocale,
      type,
      siteName,
      ...(alternates?.canonical ? { url: alternates.canonical } : {}),
      ...(images.length > 0 ? { images } : {}),
    },
    twitter: {
      card: seo?.twitterCard || 'summary_large_image',
      title: seo?.twitterTitle || seo?.metaTitle || undefined,
      description: seo?.twitterDescription || seo?.metaDescription || undefined,
      site: twitterSite,
      ...(twitterImages.length > 0 ? { images: twitterImages } : {}),
    },
    ...(alternates ? { alternates } : {}),
  }
}
