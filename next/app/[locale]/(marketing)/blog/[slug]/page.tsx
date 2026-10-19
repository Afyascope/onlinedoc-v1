import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogLayout } from "@/components/blog-layout";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { fetchCached } from "@/lib/strapi/fetchCached";
import { BlocksRenderer as BetterBlocksRenderer } from "@qkix/better-blocks-react-renderer";
import { generateMetadataObject } from '@/lib/shared/metadata';
import { detailAlternates, absoluteUrl } from '@/lib/seo/alternates';
import { strapiImage } from '@/lib/strapi/strapiImage';
import { ArticleSchema } from "@/components/seo/json-ld";

import ClientSlugHandler from "../../ClientSlugHandler";

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}): Promise<Metadata> {
  const article = await fetchContentType(
    "articles",
    {
      filters: { slug: params.slug, locale: params.locale },
      populate: {
        seo: { populate: ["metaImage"] },
        localizations: { fields: ["slug", "locale"] },
      },
    },
    true,
  );

  if (!article) {
    notFound();
  }

  const seo = article?.seo;
  return generateMetadataObject(seo, {
    locale: params.locale,
    type: "article",
    alternates: detailAlternates(article?.localizations, {
      locale: params.locale,
      slug: params.slug,
      buildPath: (locale, slug) => `/${locale}/blog/${slug}`,
    }),
  });
}

export default async function SingleArticlePage({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const article = await fetchCached(
    "articles",
    {
      filters: {
        slug: params.slug,
        locale: params.locale,
      }
    },
    true,
    true,
  );

  if (!article) {
    notFound();
  }

  const localizedSlugs = article.localizations?.reduce(
    (acc: Record<string, string>, localization: any) => {
      acc[localization.locale] = localization.slug;
      return acc;
    },
    { [params.locale]: params.slug }
  );

  const seo = (article as { seo?: any }).seo;
  const articleUrl = absoluteUrl(`/${params.locale}/blog/${params.slug}`);
  const imageSource = seo?.metaImage?.url || article.image?.url;

  return (
    <>
      <ArticleSchema
        title={seo?.metaTitle || article.title}
        description={seo?.metaDescription || article.description || ""}
        url={articleUrl}
        imageUrl={imageSource ? strapiImage(imageSource) : undefined}
        datePublished={article.publishedAt}
        dateModified={article.updatedAt}
      />
      <BlogLayout article={article} locale={params.locale}>
        <ClientSlugHandler localizedSlugs={localizedSlugs} />
        <BetterBlocksRenderer content={article.content as never} />
      </BlogLayout>
    </>
  );
}
