import { Metadata } from "next";

import { redirect } from "next/navigation";
import { Container } from "@/components/container";
import { AmbientColor } from "@/components/decorations/ambient-color";
import { SingleProduct } from "@/components/products/single-product";
import DynamicZoneManager from '@/components/dynamic-zone/manager'


import fetchContentType from "@/lib/strapi/fetchContentType";
import { fetchCached } from "@/lib/strapi/fetchCached";
import { toClientProduct, sanitizeProductDynamicZone } from "@/lib/strapi/sanitizeProduct";

export async function generateMetadata({
  params,
}: {
  params: { locale: string, slug: string };
}): Promise<Metadata> {
  const pageData = await fetchContentType("products", {
    filters: { slug: params.slug },
  }, true)

  const metadata: Metadata = {
    title: pageData?.name,
    description: pageData?.description,
  };
  return metadata;
}

export default async function SingleProductPage({
  params,
}: {
  params: { slug: string, locale: string };
}) {
  const product = await fetchCached("products", {
    filters: { slug: params.slug },
  }, true)

  if (!product) {
    redirect("/products");
  }

  // Strip the server-only downloadable file URL before serializing product
  // data to the client (both the main product and its related products).
  const clientProduct = toClientProduct(product);
  const clientDynamicZone = sanitizeProductDynamicZone(product.dynamic_zone);

  return (
    <div className="relative overflow-hidden w-full">
      <AmbientColor />
      <Container className="pt-24 pb-16 md:pt-28 md:pb-20">
        <SingleProduct product={clientProduct} />
      </Container>

      {product?.dynamic_zone && (<DynamicZoneManager dynamicZone={clientDynamicZone} locale={params.locale} />)}
    </div>
  );
}
