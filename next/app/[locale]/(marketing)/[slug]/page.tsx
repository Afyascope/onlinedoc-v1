import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import PageContent from '@/lib/shared/PageContent';
import fetchContentType from '@/lib/strapi/fetchContentType';
import { fetchCached } from '@/lib/strapi/fetchCached';
import { generateMetadataObject } from '@/lib/shared/metadata';
import { detailAlternates } from '@/lib/seo/alternates';
import { isValidLocale } from '@/lib/i18n/locale';
import ClientSlugHandler from '../ClientSlugHandler';

// Slugs that have their own dedicated route and must never be served through
// this catch-all (otherwise e.g. /en/homepage duplicates /en).
const RESERVED_PAGE_SLUGS = new Set(["homepage"]);

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  if (!isValidLocale(params.locale)) return {};
  if (RESERVED_PAGE_SLUGS.has(params.slug)) permanentRedirect(`/${params.locale}`);

  const pageData = await fetchContentType(
    "pages",
    {
      filters: {
        slug: params.slug,
        locale: params.locale,
      },
      populate: {
        seo: { populate: ["metaImage"] },
        localizations: { fields: ["slug", "locale"] },
      },
    },
    true,
  );

  if (!pageData) {
    return {
      title: "Page Not Found",
      robots: { index: false },
    };
  }

  const seo = pageData?.seo;
  return generateMetadataObject(seo, {
    locale: params.locale,
    alternates: detailAlternates(pageData?.localizations, {
      locale: params.locale,
      slug: params.slug,
      buildPath: (locale, slug) => `/${locale}/${slug}`,
    }),
  });
}

export default async function Page({ params }: { params: { locale: string, slug: string } }) {
  if (!isValidLocale(params.locale)) notFound();
  if (RESERVED_PAGE_SLUGS.has(params.slug)) permanentRedirect(`/${params.locale}`);

  const pageData = await fetchCached(
    "pages",
    {
      filters: {
        slug: params.slug,
        locale: params.locale,
      },
    },
    true,
  );

  // 2. Add this Safety Check
  // If no page is found in Strapi, show the 404 page instead of crashing.
  if (!pageData) {
    return notFound();
  }

  const localizedSlugs = pageData.localizations?.reduce(
    (acc: Record<string, string>, localization: any) => {
      acc[localization.locale] = localization.slug;
      return acc;
    },
    { [params.locale]: params.slug }
  ) || { [params.locale]: params.slug };

  return (
    <>
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <PageContent pageData={pageData} />
    </>
  );
}