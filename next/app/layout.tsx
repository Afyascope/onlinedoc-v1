import type { Viewport, Metadata } from "next";
import { headers } from "next/headers";

import "./globals.css";

import { SlugProvider } from "./context/SlugContext";
import { siteUrl } from "@/lib/config";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#F8FAFC" },
  ],
};

const siteName = "OnlineDoc Healthcare";
const defaultDescription =
  "Consult licensed clinicians online, explore a clinician-informed health library, and access digital health products with OnlineDoc Healthcare.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${siteName} | Online doctor consultations & health library`,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  applicationName: siteName,
  authors: [{ name: siteName, url: siteUrl() }],
  creator: siteName,
  publisher: siteName,
  category: "health",
  classification: "Healthcare",
  referrer: "origin-when-cross-origin",
  formatDetection: { email: false, address: false, telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName,
    title: `${siteName} | Online doctor consultations & health library`,
    description: defaultDescription,
    url: siteUrl(),
    locale: "en_US",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: `${siteName} — online consultations, health library, and digital health products`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Online doctor consultations & health library`,
    description: defaultDescription,
    images: ["/og-default.png"],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The i18n middleware forwards the active public locale as `x-locale`.
  // Routes without a locale prefix (e.g. /Services) default to English.
  const locale = headers().get("x-locale");
  const lang = locale === "sw" ? "sw" : "en";

  return (
    <html lang={lang} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SlugProvider>
          {children}
        </SlugProvider>
      </body>
    </html>
  );
}
