import { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The dashboard is served under a locale prefix (/{locale}/dashboard/),
      // so both the bare and locale-prefixed forms are disallowed.
      disallow: ["/api/", "/dashboard/", "/*/dashboard/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
