import { Metadata } from "next";

import { redirect } from "next/navigation";
import { Container } from "@/components/container";
import { AmbientColor } from "@/components/decorations/ambient-color";
import { SingleProduct } from "@/components/products/single-product";
import DynamicZoneManager from '@/components/dynamic-zone/manager'
import { generateMetadataObject } from '@/lib/shared/metadata';

import fetchContentType from "@/lib/strapi/fetchContentType";
import { fetchCached } from "@/lib/strapi/fetchCached";

export async function generateMetadata({
  params,
}: {
  params: { locale: string, slug: string };
}): Promise<Metadata> {
  const pageData = await fetchContentType("products", {
    filters: { slug: params.slug, locale: params.locale },
    populate: "seo.metaImage",
  }, true)

  const seo = pageData?.seo;
  return generateMetadataObject(seo, { locale: params.locale });
}

export default async function SingleProductPage({
  params,
}: {
  params: { slug: string, locale: string };
}) {
  const product = await fetchCached("products", {
    filters: { slug: params.slug, locale: params.locale },
  }, true)

  if (!product) {
    redirect("/products");
  }

  return (
    <div className="relative overflow-hidden w-full">
      <AmbientColor />
      <Container className="py-20 md:py-40">
        <SingleProduct product={product} />
        {product?.dynamic_zone && (<DynamicZoneManager dynamicZone={product?.dynamic_zone} locale={params.locale} />)}
      </Container>
    </div>
  );
}
