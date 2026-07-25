import type { Viewport, Metadata } from "next";

import "./globals.css";

import { SlugProvider } from "./context/SlugContext";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#F8FAFC" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://onlinedoc.healthcare"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SlugProvider>
          {children}
        </SlugProvider>
      </body>
    </html>
  );
}
