import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { AmbientColor } from "@/components/decorations/ambient-color";
import { SingleProduct } from "@/components/products/single-product";
import DynamicZoneManager from '@/components/dynamic-zone/manager'
import { absoluteUrl, OPEN_GRAPH_LOCALE } from "@/lib/seo/alternates";
import { strapiImage } from "@/lib/strapi/strapiImage";
import { ProductSchema, BreadcrumbSchema } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";


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
  const imageSource = pageData?.seo?.metaImage?.url || pageData?.images?.[0]?.url;
  const imageUrl = imageSource ? strapiImage(imageSource) : absoluteUrl("/og-default.png");
  const description =
    pageData?.seo?.metaDescription ||
    pageData?.description ||
    `Download ${pageData?.name || "this digital health resource"} from OnlineDoc Healthcare.`;

  const metadata: Metadata = {
    title: pageData?.name,
    description,
    alternates: { canonical },
    openGraph: {
      title: pageData?.name,
      description,
      url: canonical,
      siteName: "OnlineDoc Healthcare",
      locale: OPEN_GRAPH_LOCALE.en,
      type: "website",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: pageData?.name || "OnlineDoc product" }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageData?.name,
      description,
      images: [imageUrl],
    },
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
  const breadcrumbs = [
    {
      name: params.locale === "sw" ? "Nyumbani" : "Home",
      href: absoluteUrl(`/${params.locale}`),
    },
    {
      name: params.locale === "sw" ? "Bidhaa" : "Products",
      href: absoluteUrl(`/${params.locale}/products`),
    },
    { name: product.name, href: absoluteUrl(`/${params.locale}/products/${params.slug}`) },
  ];

  return (
    <main className="relative overflow-hidden w-full">
      <BreadcrumbSchema items={breadcrumbs} />
      <ProductSchema
        name={product.name}
        description={productSeo?.metaDescription || product.description || ""}
        url={absoluteUrl(`/en/products/${params.slug}`)}
        imageUrl={productImage ? strapiImage(productImage) : undefined}
        sku={product.slug}
        price={product.price}
        priceCurrency="KES"
      />
      <AmbientColor />
      <Container className="pt-24 pb-16 md:pt-28 md:pb-20">
        <Breadcrumbs items={breadcrumbs} />
        <SingleProduct product={clientProduct} />
      </Container>

      {product?.dynamic_zone && (<DynamicZoneManager dynamicZone={clientDynamicZone} locale={params.locale} />)}
    </main>
  );
}
