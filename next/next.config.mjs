/**
 * Derives the Next/Image remote pattern from the Strapi origin already defined
 * by NEXT_PUBLIC_API_URL (the same origin that `strapiImage()` uses to build
 * media URLs). This keeps the image configuration environment-driven without
 * introducing a second configuration source.
 *
 * - Development: NEXT_PUBLIC_API_URL=http://localhost:1337 → http/localhost:1337
 * - Production:  NEXT_PUBLIC_API_URL=https://cms.example.com → https/cms.example.com
 *
 * Only the Strapi/media origin is allowed. No wildcard and no arbitrary hosts.
 */
function strapiImageRemotePatterns() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return [];
  try {
    const parsed = new URL(apiUrl);
    return [
      {
        protocol: parsed.protocol.replace(":", ""),
        hostname: parsed.hostname,
        ...(parsed.port ? { port: parsed.port } : {}),
      },
    ];
  } catch {
    return [];
  }
}

function r2ImageRemotePatterns() {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  if (!endpoint || !bucket) return [];
  try {
    const parsed = new URL(endpoint);
    return [{
      protocol: parsed.protocol.replace(":", ""),
      hostname: `${bucket}.${parsed.hostname}`,
    }];
  } catch {
    return [];
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,

  images: {
    // Serve modern formats first to reduce image bytes and improve LCP.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      ...strapiImageRemotePatterns(),
      ...r2ImageRemotePatterns(),
    ],
  },

  pageExtensions: ["ts", "tsx"],

  // Catalogue imports allow files up to 10 MB. Leave headroom for multipart
  // form overhead; the catalogue parser enforces the exact 10 MB limit.
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },

  // 3. REDIRECTS: Keep your dynamic redirect logic
  async redirects() {
    // Legacy links still stored in the CMS navigation/footer. These are kept
    // static so they work even when Strapi is unreachable during a build.
    let redirections = [
      { source: "/:locale/product", destination: "/:locale/products", permanent: true },
      { source: "/:locale/policy", destination: "/:locale/privacy-policy", permanent: true },
      { source: "/:locale/terms", destination: "/:locale/terms-of-service", permanent: true },
      { source: "/:locale/disclaimer", destination: "/:locale/terms-of-service#medical-disclaimer", permanent: true },
      { source: "/:locale/consultation", destination: "/:locale/register", permanent: false },
    ];
    if (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_API_URL must be configured in production");
    }
    if (!process.env.NEXT_PUBLIC_API_URL) return redirections;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/redirections`
      );
      // If API is down during build, don't crash the whole deploy
      if (!res.ok) return redirections;
      
      const result = await res.json();
      const seen = new Set(redirections.map((redirect) => redirect.source));
      const redirectItems = result.data
        .map(({ source, destination }) => ({
          source: `/:locale${source}`,
          destination: `/:locale${destination}`,
          permanent: false,
        }))
        .filter((redirect) => !seen.has(redirect.source));

      redirections = redirections.concat(redirectItems);
      return redirections;
    } catch (error) {
      // Keep the static redirects if Strapi is unreachable during build.
      console.warn("Could not fetch redirects during build, using static redirects...");
      return redirections;
    }
  },
};

export default nextConfig;
