import React from 'react'

import { Metadata } from 'next';
/* 1. Import BOTH fonts */
import { Inter, Montserrat } from 'next/font/google';
import { generateMetadataObject } from '@/lib/shared/metadata';

import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { CartProvider } from '@/context/cart-context';
import { cn } from '@/lib/utils';
import { ViewTransitions } from 'next-view-transitions';
import fetchContentType from '@/lib/strapi/fetchContentType';
import { Analytics } from '@vercel/analytics/react';


/* 2. Configure Inter (Body Font) */
const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter", // Matches tailwind.config.ts
    weight: ["400", "500", "600", "700"],
});

/* 3. Configure Montserrat (Heading Font) */
const montserrat = Montserrat({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-montserrat", // Matches tailwind.config.ts
    weight: ["500", "600", "700", "800"],
});

// Default Global SEO for pages without them
export async function generateMetadata({
    params,
}: {
    params: { locale: string; slug: string };
}): Promise<Metadata> {
    const pageData = await fetchContentType(
        'global',
        {
            filters: { locale: params.locale },
            populate: "seo.metaImage",
        },
        true
    );

    const seo = pageData?.seo;
    const metadata = generateMetadataObject(seo);
    return metadata;
}

export default async function LocaleLayout({
    children,
    params: { locale }
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {

    const pageData = await fetchContentType('global', { filters: { locale } }, true);
    
    return (
        /* 4. Add bg-charcoal here to ensure full coverage */
        <html lang={locale} className="bg-charcoal h-full">
            <ViewTransitions>
                <CartProvider>
                    <body
                        className={cn(
                            /* Inject both font variables */
                            inter.variable,
                            montserrat.variable,
                            /* Force the background and primary font */
                            "bg-charcoal antialiased h-full w-full font-secondary text-white"
                        )}
                    >
                        <Navbar data={pageData.navbar} locale={locale} />
                        {children}
                        <Footer data={pageData.footer} locale={locale} />
                    </body>
                </CartProvider>
            </ViewTransitions>
        </html>
    );
}