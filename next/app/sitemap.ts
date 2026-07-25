import { MetadataRoute } from "next";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { i18n } from "@/i18n.config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://onlinedoc.healthcare";
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of i18n.locales) {
    // Homepage
    entries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    });

    // Blog index
    entries.push({
      url: `${baseUrl}/${locale}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });

    // Products index
    entries.push({
      url: `${baseUrl}/${locale}/products`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });

    // Dynamic pages
    try {
      const pages = await fetchContentType("pages", {
        filters: { locale },
        fields: "slug,updatedAt",
      });
      if (pages?.data) {
        const pageList = Array.isArray(pages.data) ? pages.data : [pages.data];
        for (const page of pageList) {
          const slug = page.slug || page.attributes?.slug;
          const updated = page.updatedAt || page.attributes?.updatedAt;
          if (slug && slug !== "homepage") {
            entries.push({
              url: `${baseUrl}/${locale}/${slug}`,
              lastModified: new Date(updated),
              changeFrequency: "monthly",
              priority: 0.7,
            });
          }
        }
      }
    } catch {}

    // Blog articles
    try {
      const articles = await fetchContentType("articles", {
        filters: { locale },
        fields: "slug,updatedAt",
      });
      const articleList = articles?.data;
      if (Array.isArray(articleList)) {
        for (const article of articleList) {
          const slug = article.slug || article.attributes?.slug;
          const updated = article.updatedAt || article.attributes?.updatedAt;
          if (slug) {
            entries.push({
              url: `${baseUrl}/${locale}/blog/${slug}`,
              lastModified: new Date(updated),
              changeFrequency: "monthly",
              priority: 0.6,
            });
          }
        }
      }
    } catch {}

    // Products
    try {
      const products = await fetchContentType("products", {
        filters: { locale },
        fields: "slug,updatedAt",
      });
      const productList = products?.data;
      if (Array.isArray(productList)) {
        for (const product of productList) {
          const slug = product.slug || product.attributes?.slug;
          const updated = product.updatedAt || product.attributes?.updatedAt;
          if (slug) {
            entries.push({
              url: `${baseUrl}/${locale}/products/${slug}`,
              lastModified: new Date(updated),
              changeFrequency: "monthly",
              priority: 0.6,
            });
          }
        }
      }
    } catch {}
  }

  return entries;
}
