import React from 'react'

import { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import { generateMetadataObject } from '@/lib/shared/metadata';

import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { CartProvider } from '@/context/cart-context';
import { cn } from '@/lib/utils';
import { ViewTransitions } from 'next-view-transitions';
import fetchContentType from '@/lib/strapi/fetchContentType';
import { Analytics } from '@vercel/analytics/react';
import SetLang from './SetLang';
import { OrganizationSchema } from '@/components/seo/json-ld';

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
    weight: ["400", "500", "600", "700"],
});

const montserrat = Montserrat({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-montserrat",
    weight: ["500", "600", "700", "800"],
});

export async function generateMetadata({
    params,
}: {
    params: { locale: string };
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
    const metadata = generateMetadataObject(seo, { locale: params.locale });
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
        <ViewTransitions>
            <CartProvider>
                <SetLang locale={locale} />
                <OrganizationSchema />
                <div
                    className={cn(
                        inter.variable,
                        montserrat.variable,
                        "bg-surface antialiased h-full w-full font-secondary text-[var(--color-text-primary)]"
                    )}
                >
                    <Navbar data={pageData?.navbar} locale={locale} />
                    {children}
                    <Footer data={pageData?.footer} locale={locale} />
                </div>
            </CartProvider>
            <Analytics />
        </ViewTransitions>
    );
}
