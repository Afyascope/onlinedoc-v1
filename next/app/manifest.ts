import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OnlineDoc Healthcare",
    short_name: "OnlineDoc",
    description: "Digital healthcare platform connecting patients with providers",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#F8FAFC",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      // `app/icon.tsx` generates the brand icon and is served at /icon. The
      // previous "/icon.svg" reference had no matching static route, so the
      // browser request fell through to the [locale] route and rendered the
      // homepage with locale=icon.svg.
      { src: "/icon", sizes: "any", type: "image/png" },
    ],
  };
}
