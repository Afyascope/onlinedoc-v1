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

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: strapiImageRemotePatterns(),
  },

  pageExtensions: ["ts", "tsx"],

  // 3. REDIRECTS: Keep your dynamic redirect logic
  async redirects() {
    let redirections = [];
    if (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_API_URL must be configured in production");
    }
    if (!process.env.NEXT_PUBLIC_API_URL) return [];
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/redirections`
      );
      // If API is down during build, don't crash the whole deploy
      if (!res.ok) return [];
      
      const result = await res.json();
      const redirectItems = result.data.map(({ source, destination }) => {
        return {
          source: `/:locale${source}`,
          destination: `/:locale${destination}`,
          permanent: false,
        };
      });

      redirections = redirections.concat(redirectItems);
      return redirections;
    } catch (error) {
      // Return empty array if Strapi is unreachable during build
      console.warn("Could not fetch redirects during build, skipping...");
      return [];
    }
  },
};

export default nextConfig;
