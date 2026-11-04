import { Metadata } from 'next';

import { AmbientColor } from "@/components/decorations/ambient-color";
import { Container } from "@/components/container";
import { Featured } from "@/components/products/featured";
import { ProductsHero } from "@/components/products/products-hero";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { fetchCached } from "@/lib/strapi/fetchCached";
import { toClientProducts } from "@/lib/strapi/sanitizeProduct";
import { generateMetadataObject } from '@/lib/shared/metadata';
import { routeAlternates } from '@/lib/seo/alternates';
import { MarketplaceCatalog } from "./catalog";
import { ItemListSchema } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/seo/alternates";

import ClientSlugHandler from '../ClientSlugHandler';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {

  const pageData = await fetchContentType("product-page", {
    filters: {
      locale: params.locale,
    },
    populate: "seo.metaImage",
  }, true)

  const seo = pageData?.seo;
  const metadata = generateMetadataObject(seo, {
    locale: params.locale,
    alternates: routeAlternates(locale => `/${locale}/products`, params.locale),
    fallbackTitle: "Products",
    fallbackDescription:
      pageData?.sub_heading ||
      "Explore digital health products and resources created by OnlineDoc clinicians.",
  });
  return metadata;
}

export default async function Products({
  params,
}: {
  params: { locale: string };
}) {

  const productPage = await fetchCached('product-page', {
    filters: {
      locale: params.locale,
    },
  }, true);
  const strapiRes = await fetchContentType('products');
  const products = toClientProducts(strapiRes?.data || []);

  const localizedSlugs = productPage?.localizations?.reduce(
    (acc: Record<string, string>, localization: any) => {
      acc[localization.locale] = "products";
      return acc;
    },
    { [params.locale]: "products" }
  ) || { [params.locale]: "products" };
  const featured = products?.filter((product: any) => product.featured);
  const itemList = products
    .filter((product: any) => product?.slug && product?.name)
    .map((product: any) => ({
      name: product.name,
      url: absoluteUrl(`/en/products/${product.slug}`),
    }));

  return (
    <main className="relative overflow-hidden w-full">
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      {itemList.length > 0 ? (
        <ItemListSchema name="OnlineDoc digital health products" items={itemList} />
      ) : null}
      <AmbientColor />
      <Container className="pt-28 md:pt-32 pb-20">
        <ProductsHero
          heading={productPage?.heading || "Digital health resources, products and tools for better care."}
          subHeading={productPage?.sub_heading || "Discover digital health products and resources created by OnlineDoc clinicians to support better care."}
          products={products}
          locale={params.locale}
        />
        <Featured products={featured} locale={params.locale} />
        <MarketplaceCatalog products={products} locale={params.locale} />
      </Container>
    </main>
  );
}
