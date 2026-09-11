import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import PageContent from '@/lib/shared/PageContent';
import fetchContentType from '@/lib/strapi/fetchContentType';
import { fetchCached } from '@/lib/strapi/fetchCached';
import { generateMetadataObject } from '@/lib/shared/metadata';
import { sanitizeProductDynamicZone } from '@/lib/strapi/sanitizeProduct';
import { isValidLocale } from '@/lib/i18n/locale';
import ClientSlugHandler from './ClientSlugHandler';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {

  if (!isValidLocale(params.locale)) return {};

  const pageData = await fetchContentType(
    'pages',
    {
      filters: {
        slug: "homepage",
        locale: params.locale,
      },
      populate: "seo.metaImage",
    },
    true
  );

  const seo = pageData?.seo;
  const metadata = generateMetadataObject(seo, { locale: params.locale });
  return metadata;
}

export default async function HomePage({ params }: { params: { locale: string } }) {

  if (!isValidLocale(params.locale)) notFound();

  const pageData = await fetchCached(
    'pages',
    {
      filters: {
        slug: "homepage",
        locale: params.locale,
      },
    },
    true
  );

  const localizedSlugs = pageData?.localizations?.reduce(
    (acc: Record<string, string>, localization: any) => {
      acc[localization.locale] = "";
      return acc;
    },
    { [params.locale]: "" }
  ) || { [params.locale]: "" };

  const safePageData = pageData
    ? { ...pageData, dynamic_zone: sanitizeProductDynamicZone(pageData.dynamic_zone) }
    : pageData;

  return <>
    <ClientSlugHandler localizedSlugs={localizedSlugs} />
    <PageContent pageData={safePageData} />
  </>;
}
