import Script from "next/script";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://onlinedoc.healthcare";

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OnlineDoc Healthcare",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      "https://twitter.com/onlinedoc",
      "https://linkedin.com/company/onlinedoc",
      "https://facebook.com/onlinedoc",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+254700000000",
      contactType: "customer service",
    },
  };

  return (
    <Script
      id="schema-organization"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ArticleSchema({
  title,
  description,
  url,
  imageUrl,
  datePublished,
  dateModified,
  authorName,
}: {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    ...(imageUrl ? { image: imageUrl } : {}),
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Person",
      name: authorName || "OnlineDoc Healthcare",
    },
    publisher: {
      "@type": "Organization",
      name: "OnlineDoc Healthcare",
    },
  };

  return (
    <Script
      id="schema-article"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ProductSchema({
  name,
  description,
  url,
  imageUrl,
}: {
  name: string;
  description: string;
  url: string;
  imageUrl?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url,
    ...(imageUrl ? { image: imageUrl } : {}),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KES",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <Script
      id="schema-product"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
