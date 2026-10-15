import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { AmbientColor } from "@/components/decorations/ambient-color";
import { SingleProduct } from "@/components/products/single-product";
import DynamicZoneManager from '@/components/dynamic-zone/manager'
import { absoluteUrl } from "@/lib/seo/alternates";
import { strapiImage } from "@/lib/strapi/strapiImage";
import { ProductSchema } from "@/components/seo/json-ld";


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

  if (!pageData) {
    notFound();
  }

  // Products are not localized: the same entry is served under every locale
  // prefix, so it is canonicalized to the default-locale URL with no hreflang.
  const canonical = absoluteUrl(`/en/products/${params.slug}`);

  const metadata: Metadata = {
    title: pageData?.name,
    description: pageData?.description,
    alternates: { canonical },
    openGraph: { url: canonical },
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
    notFound();
  }

  // Strip the server-only downloadable file URL before serializing product
  // data to the client (both the main product and its related products).
  const clientProduct = toClientProduct(product);
  const clientDynamicZone = sanitizeProductDynamicZone(product.dynamic_zone);

  const productSeo = (product as { seo?: any }).seo;
  const productImage = productSeo?.metaImage?.url || product.images?.[0]?.url;

  return (
    <div className="relative overflow-hidden w-full">
      <ProductSchema
        name={product.name}
        description={productSeo?.metaDescription || product.description || ""}
        url={absoluteUrl(`/en/products/${params.slug}`)}
        imageUrl={productImage ? strapiImage(productImage) : undefined}
        price={product.price}
        priceCurrency="KES"
      />
      <AmbientColor />
      <Container className="pt-24 pb-16 md:pt-28 md:pb-20">
        <SingleProduct product={clientProduct} />
      </Container>

      {product?.dynamic_zone && (<DynamicZoneManager dynamicZone={clientDynamicZone} locale={params.locale} />)}
    </div>
  );
}
