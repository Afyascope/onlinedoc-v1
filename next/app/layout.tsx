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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
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
