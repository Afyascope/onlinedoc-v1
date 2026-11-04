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
import { ArticleSchema, BreadcrumbSchema } from "@/components/seo/json-ld";

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
    publishedTime: article?.publishedAt,
    modifiedTime: article?.updatedAt,
    authors: ["OnlineDoc Healthcare"],
    alternates: detailAlternates(article?.localizations, {
      locale: params.locale,
      slug: params.slug,
      buildPath: (locale, slug) => `/${locale}/blog/${slug}`,
    }),
    fallbackTitle: article?.title,
    fallbackDescription: article?.description,
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

  const breadcrumbs = [
    {
      name: params.locale === "sw" ? "Nyumbani" : "Home",
      href: absoluteUrl(`/${params.locale}`),
    },
    {
      name: params.locale === "sw" ? "Makala" : "Blog",
      href: absoluteUrl(`/${params.locale}/blog`),
    },
    { name: article.title, href: articleUrl },
  ];

  return (
    <>
      <ArticleSchema
        title={seo?.metaTitle || article.title}
        description={seo?.metaDescription || article.description || ""}
        url={articleUrl}
        imageUrl={imageSource ? strapiImage(imageSource) : undefined}
        datePublished={article.publishedAt}
        dateModified={article.updatedAt}
        inLanguage={params.locale}
      />
      <BreadcrumbSchema items={breadcrumbs} />
      <BlogLayout
        article={article}
        locale={params.locale}
        breadcrumbs={breadcrumbs}
      >
        <ClientSlugHandler localizedSlugs={localizedSlugs} />
        <BetterBlocksRenderer content={article.content as never} />
      </BlogLayout>
    </>
  );
}
