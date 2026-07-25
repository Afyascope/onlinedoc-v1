import { Metadata } from 'next';
import { notFound } from 'next/navigation'; // 1. Add this import
import PageContent from '@/lib/shared/PageContent';
import fetchContentType from '@/lib/strapi/fetchContentType';
import { generateMetadataObject } from '@/lib/shared/metadata';
import ClientSlugHandler from '../ClientSlugHandler';

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const pageData = await fetchContentType(
    "pages",
    {
      filters: {
        slug: params.slug,
        locale: params.locale,
      },
      populate: "seo.metaImage",
    },
    true,
  );

  const seo = pageData?.seo;
  const metadata = generateMetadataObject(seo);
  return metadata;
}

export default async function Page({ params }: { params: { locale: string, slug: string } }) {
  const pageData = await fetchContentType(
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
  );

  return (
    <>
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <PageContent pageData={pageData} />
    </>
  );
}