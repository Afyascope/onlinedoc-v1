import { siteUrl as configuredSiteUrl } from "@/lib/config";

const siteUrl = configuredSiteUrl();
const organizationId = `${siteUrl}/#organization`;
const websiteId = `${siteUrl}/#website`;
const logoUrl = `${siteUrl}/logo.png`;
const siteName = "OnlineDoc Healthcare";

/**
 * JSON-LD must be present in the server-rendered HTML. Using `next/script`
 * injects it on the client (afterInteractive), which crawlers may never see.
 * Rendering a plain <script> tag keeps it in the initial response.
 */
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function JsonLd({ id, data }: { id: string; data: unknown }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId,
    name: siteName,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
      width: 512,
      height: 512,
    },
    description:
      "OnlineDoc Healthcare connects patients with licensed clinicians for online consultations and provides a clinician-informed health library and digital health products.",
    areaServed: {
      "@type": "Country",
      name: "Kenya",
    },
    knowsAbout: [
      "Online medical consultations",
      "General health information",
      "Medicines and treatments",
      "Medical tests and investigations",
      "Nutrition guidance",
    ],
  };

  return <JsonLd id="schema-organization" data={schema} />;
}

export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId,
    url: siteUrl,
    name: siteName,
    description:
      "Online doctor consultations, a clinician-informed health library, and digital health products.",
    inLanguage: ["en", "sw"],
    publisher: { "@id": organizationId },
  };

  return <JsonLd id="schema-website" data={schema} />;
}

export function ArticleSchema({
  title,
  description,
  url,
  imageUrl,
  datePublished,
  dateModified,
  authorName,
  inLanguage = "en",
}: {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  inLanguage?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    image: [imageUrl || `${siteUrl}/og-default.png`],
    datePublished,
    dateModified: dateModified || datePublished,
    inLanguage,
    isAccessibleForFree: true,
    author: authorName
      ? { "@type": "Person", name: authorName }
      : { "@id": organizationId },
    publisher: {
      "@type": "Organization",
      "@id": organizationId,
      name: siteName,
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
        width: 512,
        height: 512,
      },
    },
  };

  return <JsonLd id="schema-article" data={schema} />;
}

export function ProductSchema({
  name,
  description,
  url,
  imageUrl,
  sku,
  price,
  priceCurrency = "KES",
}: {
  name: string;
  description: string;
  url: string;
  imageUrl?: string;
  sku?: string;
  price?: number | string | null;
  priceCurrency?: string;
}) {
  const hasPrice = price !== undefined && price !== null && `${price}`.trim() !== "";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url,
    ...(sku ? { sku } : {}),
    brand: {
      "@type": "Organization",
      name: siteName,
    },
    category: "Digital health products",
    image: [imageUrl || `${siteUrl}/og-default.png`],
    offers: {
      "@type": "Offer",
      url,
      ...(hasPrice ? { price: `${price}` } : {}),
      priceCurrency,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": organizationId },
    },
  };

  return <JsonLd id="schema-product" data={schema} />;
}

export function BreadcrumbSchema({
  items,
}: {
  items: Array<{ name: string; href: string }>;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.href,
    })),
  };

  return <JsonLd id="schema-breadcrumb" data={schema} />;
}

export function ItemListSchema({
  name,
  items,
}: {
  name: string;
  items: Array<{ name: string; url: string }>;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };

  return <JsonLd id="schema-item-list" data={schema} />;
}

/**
 * MedicalWebPage covers patient-facing health content. `about` describes the
 * specific entity (condition, drug, test) so search engines can associate the
 * page with the right medical topic. Reviewer fields are intentionally omitted
 * until the CMS exposes a verified reviewer, rather than being fabricated.
 */
export function MedicalWebPageSchema({
  title,
  description,
  url,
  inLanguage,
  datePublished,
  dateModified,
  aboutType,
  section,
}: {
  title: string;
  description?: string;
  url: string;
  inLanguage: string;
  datePublished?: string;
  dateModified?: string;
  aboutType?: "MedicalCondition" | "Drug" | "MedicalTest" | "MedicalProcedure";
  section?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: title,
    url,
    inLanguage,
    ...(description ? { description } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    ...(section ? { articleSection: section } : {}),
    isPartOf: { "@id": websiteId },
    audience: { "@type": "Patient" },
    publisher: { "@id": organizationId },
    ...(aboutType
      ? {
          about: {
            "@type": aboutType,
            name: title,
          },
        }
      : {}),
  };

  return <JsonLd id="schema-medical-webpage" data={schema} />;
}
